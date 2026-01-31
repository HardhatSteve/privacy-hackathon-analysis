// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title LaunchpadToken
 * @dev ERC-20 Token with 1% transfer fee sent to fee collector
 * @notice This token automatically collects 1% fee on all transfers
 */
contract LaunchpadToken {
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;
    
    address public immutable feeCollector;
    uint256 public constant FEE_PERCENTAGE = 1; // 1% fee
    uint256 public constant FEE_DENOMINATOR = 100;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    mapping(address => bool) public isExcludedFromFee;
    
    address public owner;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event FeeCollected(address indexed from, address indexed to, uint256 amount);
    event ExcludedFromFee(address indexed account, bool isExcluded);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    /**
     * @dev Constructor
     * @param _name Token name
     * @param _symbol Token symbol
     * @param _decimals Token decimals
     * @param _totalSupply Total supply (in smallest unit)
     * @param _feeCollector Address to receive fees
     */
    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        uint256 _totalSupply,
        address _feeCollector
    ) {
        require(_feeCollector != address(0), "Fee collector cannot be zero address");
        require(_totalSupply > 0, "Total supply must be greater than 0");
        
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        totalSupply = _totalSupply;
        feeCollector = _feeCollector;
        owner = msg.sender;
        
        // Mint total supply to deployer
        balanceOf[msg.sender] = _totalSupply;
        
        // Exclude fee collector and owner from fees
        isExcludedFromFee[_feeCollector] = true;
        isExcludedFromFee[msg.sender] = true;
        
        emit Transfer(address(0), msg.sender, _totalSupply);
    }
    
    /**
     * @dev Transfer tokens with 1% fee
     */
    function transfer(address to, uint256 value) public returns (bool) {
        return _transfer(msg.sender, to, value);
    }
    
    /**
     * @dev Approve spender
     */
    function approve(address spender, uint256 value) public returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }
    
    /**
     * @dev Transfer from with allowance
     */
    function transferFrom(address from, address to, uint256 value) public returns (bool) {
        require(allowance[from][msg.sender] >= value, "Insufficient allowance");
        allowance[from][msg.sender] -= value;
        return _transfer(from, to, value);
    }
    
    /**
     * @dev Internal transfer function with fee logic
     */
    function _transfer(address from, address to, uint256 value) internal returns (bool) {
        require(from != address(0), "Transfer from zero address");
        require(to != address(0), "Transfer to zero address");
        require(balanceOf[from] >= value, "Insufficient balance");
        
        uint256 fee = 0;
        uint256 amountAfterFee = value;
        
        // Calculate fee if neither sender nor receiver is excluded
        if (!isExcludedFromFee[from] && !isExcludedFromFee[to]) {
            fee = (value * FEE_PERCENTAGE) / FEE_DENOMINATOR;
            amountAfterFee = value - fee;
        }
        
        // Transfer
        balanceOf[from] -= value;
        balanceOf[to] += amountAfterFee;
        
        // Collect fee
        if (fee > 0) {
            balanceOf[feeCollector] += fee;
            emit FeeCollected(from, feeCollector, fee);
            emit Transfer(from, feeCollector, fee);
        }
        
        emit Transfer(from, to, amountAfterFee);
        return true;
    }
    
    /**
     * @dev Exclude or include address from fees (only owner)
     */
    function setFeeExclusion(address account, bool excluded) external onlyOwner {
        require(account != address(0), "Cannot modify zero address");
        isExcludedFromFee[account] = excluded;
        emit ExcludedFromFee(account, excluded);
    }
    
    /**
     * @dev Renounce ownership
     */
    function renounceOwnership() external onlyOwner {
        owner = address(0);
    }
    
    /**
     * @dev Transfer ownership
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        owner = newOwner;
    }
}
