// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title GensoMultisig
/// @notice GENSO Wallet 用のシンプルなマルチシグウォレット。
///         POL(ネイティブ)およびERC20(USDT, JPYCなど)の送金、
///         承認者の追加/削除、Thresholdの変更をProposalとして扱う。
contract GensoMultisig {
    // ------------------------------------------------------------------
    // Types
    // ------------------------------------------------------------------

    enum ProposalType {
        NativeTransfer, // POL送金
        ERC20Transfer, // USDT / JPYC 送金
        AddOwner, // 承認者追加
        RemoveOwner, // 承認者削除
        ChangeThreshold // Threshold変更
    }

    enum ProposalStatus {
        Pending,
        Executed,
        Rejected
    }

    struct Proposal {
        uint256 id;
        ProposalType proposalType;
        address proposer;
        address target; // 送金先 or 追加/削除対象の承認者アドレス
        address token; // ERC20送金の場合のトークンアドレス（0x0はネイティブ）
        uint256 amount; // 送金額 or 新Threshold
        string title;
        string description;
        uint256 createdAt;
        ProposalStatus status;
        uint256 approvalCount;
        uint256 rejectionCount;
    }

    // ------------------------------------------------------------------
    // Storage
    // ------------------------------------------------------------------

    string public walletName;
    address[] public owners;
    mapping(address => bool) public isOwner;
    uint256 public threshold;

    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;
    // proposalId => owner => voted?
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    // proposalId => owner => approve(true) / reject(false)
    mapping(uint256 => mapping(address => bool)) public voteChoice;

    // ------------------------------------------------------------------
    // Events
    // ------------------------------------------------------------------

    event ProposalCreated(
        uint256 indexed id,
        ProposalType proposalType,
        address indexed proposer,
        string title
    );
    event Voted(uint256 indexed id, address indexed voter, bool approved);
    event ProposalExecuted(uint256 indexed id);
    event ProposalRejected(uint256 indexed id);
    event OwnerAdded(address indexed owner);
    event OwnerRemoved(address indexed owner);
    event ThresholdChanged(uint256 newThreshold);
    event NativeReceived(address indexed from, uint256 amount);

    // ------------------------------------------------------------------
    // Modifiers
    // ------------------------------------------------------------------

    modifier onlyOwner() {
        require(isOwner[msg.sender], "GensoMultisig: not an owner");
        _;
    }

    // ------------------------------------------------------------------
    // Constructor
    // ------------------------------------------------------------------

    constructor(
        string memory _walletName,
        address[] memory _owners,
        uint256 _threshold
    ) {
        require(_owners.length > 0, "GensoMultisig: owners required");
        require(
            _threshold > 0 && _threshold <= _owners.length,
            "GensoMultisig: invalid threshold"
        );

        for (uint256 i = 0; i < _owners.length; i++) {
            address owner = _owners[i];
            require(owner != address(0), "GensoMultisig: zero address");
            require(!isOwner[owner], "GensoMultisig: duplicate owner");
            isOwner[owner] = true;
            owners.push(owner);
        }

        walletName = _walletName;
        threshold = _threshold;
    }

    receive() external payable {
        emit NativeReceived(msg.sender, msg.value);
    }

    // ------------------------------------------------------------------
    // Proposal creation
    // ------------------------------------------------------------------

    function proposeNativeTransfer(
        string memory _title,
        string memory _description,
        address _to,
        uint256 _amount
    ) external onlyOwner returns (uint256) {
        require(_to != address(0), "GensoMultisig: zero address");
        return
            _createProposal(
                ProposalType.NativeTransfer,
                _title,
                _description,
                _to,
                address(0),
                _amount
            );
    }

    function proposeERC20Transfer(
        string memory _title,
        string memory _description,
        address _token,
        address _to,
        uint256 _amount
    ) external onlyOwner returns (uint256) {
        require(_to != address(0), "GensoMultisig: zero address");
        require(_token != address(0), "GensoMultisig: zero token");
        return
            _createProposal(
                ProposalType.ERC20Transfer,
                _title,
                _description,
                _to,
                _token,
                _amount
            );
    }

    function proposeAddOwner(
        string memory _title,
        string memory _description,
        address _newOwner
    ) external onlyOwner returns (uint256) {
        require(_newOwner != address(0), "GensoMultisig: zero address");
        require(!isOwner[_newOwner], "GensoMultisig: already owner");
        return
            _createProposal(
                ProposalType.AddOwner,
                _title,
                _description,
                _newOwner,
                address(0),
                0
            );
    }

    function proposeRemoveOwner(
        string memory _title,
        string memory _description,
        address _owner
    ) external onlyOwner returns (uint256) {
        require(isOwner[_owner], "GensoMultisig: not an owner");
        require(owners.length > 1, "GensoMultisig: cannot remove last owner");
        return
            _createProposal(
                ProposalType.RemoveOwner,
                _title,
                _description,
                _owner,
                address(0),
                0
            );
    }

    function proposeChangeThreshold(
        string memory _title,
        string memory _description,
        uint256 _newThreshold
    ) external onlyOwner returns (uint256) {
        require(_newThreshold > 0, "GensoMultisig: invalid threshold");
        return
            _createProposal(
                ProposalType.ChangeThreshold,
                _title,
                _description,
                address(0),
                address(0),
                _newThreshold
            );
    }

    function _createProposal(
        ProposalType _type,
        string memory _title,
        string memory _description,
        address _target,
        address _token,
        uint256 _amount
    ) internal returns (uint256) {
        uint256 id = proposalCount;
        proposals[id] = Proposal({
            id: id,
            proposalType: _type,
            proposer: msg.sender,
            target: _target,
            token: _token,
            amount: _amount,
            title: _title,
            description: _description,
            createdAt: block.timestamp,
            status: ProposalStatus.Pending,
            approvalCount: 0,
            rejectionCount: 0
        });
        proposalCount++;

        emit ProposalCreated(id, _type, msg.sender, _title);
        return id;
    }

    // ------------------------------------------------------------------
    // Voting
    // ------------------------------------------------------------------

    function vote(uint256 _id, bool _approve) external onlyOwner {
        Proposal storage p = proposals[_id];
        require(p.status == ProposalStatus.Pending, "GensoMultisig: not pending");
        require(!hasVoted[_id][msg.sender], "GensoMultisig: already voted");

        hasVoted[_id][msg.sender] = true;
        voteChoice[_id][msg.sender] = _approve;

        if (_approve) {
            p.approvalCount += 1;
        } else {
            p.rejectionCount += 1;
        }

        emit Voted(_id, msg.sender, _approve);

        if (p.approvalCount >= threshold) {
            _execute(_id);
        } else if (p.rejectionCount > owners.length - threshold) {
            // これ以上承認が集まっても閾値に届かない場合は自動的に却下
            p.status = ProposalStatus.Rejected;
            emit ProposalRejected(_id);
        }
    }

    function _execute(uint256 _id) internal {
        Proposal storage p = proposals[_id];
        p.status = ProposalStatus.Executed;

        if (p.proposalType == ProposalType.NativeTransfer) {
            (bool success, ) = payable(p.target).call{value: p.amount}("");
            require(success, "GensoMultisig: native transfer failed");
        } else if (p.proposalType == ProposalType.ERC20Transfer) {
            _erc20Transfer(p.token, p.target, p.amount);
        } else if (p.proposalType == ProposalType.AddOwner) {
            isOwner[p.target] = true;
            owners.push(p.target);
            emit OwnerAdded(p.target);
        } else if (p.proposalType == ProposalType.RemoveOwner) {
            _removeOwner(p.target);
            emit OwnerRemoved(p.target);
            if (threshold > owners.length) {
                threshold = owners.length;
                emit ThresholdChanged(threshold);
            }
        } else if (p.proposalType == ProposalType.ChangeThreshold) {
            require(p.amount <= owners.length, "GensoMultisig: threshold too high");
            threshold = p.amount;
            emit ThresholdChanged(threshold);
        }

        emit ProposalExecuted(_id);
    }

    function _removeOwner(address _owner) internal {
        isOwner[_owner] = false;
        uint256 len = owners.length;
        for (uint256 i = 0; i < len; i++) {
            if (owners[i] == _owner) {
                owners[i] = owners[len - 1];
                owners.pop();
                break;
            }
        }
    }

    function _erc20Transfer(address _token, address _to, uint256 _amount) internal {
        // transfer(address,bytes4)相当を直接呼び出し
        (bool success, bytes memory data) = _token.call(
            abi.encodeWithSignature("transfer(address,uint256)", _to, _amount)
        );
        require(
            success && (data.length == 0 || abi.decode(data, (bool))),
            "GensoMultisig: erc20 transfer failed"
        );
    }

    // ------------------------------------------------------------------
    // Views
    // ------------------------------------------------------------------

    function getOwners() external view returns (address[] memory) {
        return owners;
    }

    function getOwnerCount() external view returns (uint256) {
        return owners.length;
    }

    function getProposal(uint256 _id) external view returns (Proposal memory) {
        return proposals[_id];
    }
}
