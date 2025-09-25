// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title SubscriptionService
 * @dev Simple subscription contract for MetaMask Smart Accounts x Monad hackathon
 */
contract SubscriptionService {
    struct SubscriptionPlan {
        uint256 price;
        uint256 duration;
        string title;
        bool active;
    }
    
    struct Subscription {
        uint256 planId;
        uint256 expiresAt;
        bool active;
    }
    
    mapping(uint256 => SubscriptionPlan) public plans;
    mapping(address => Subscription) public subscriptions;
    
    uint256 public planCount;
    address public owner;
    
    event Subscribed(address indexed subscriber, uint256 planId, uint256 expiresAt);
    event PlanCreated(uint256 planId, string title, uint256 price, uint256 duration);
    event SubscriptionCancelled(address indexed subscriber, uint256 planId, uint256 cancelledAt);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        
        // Create default subscription plans
        createPlan("Basic Newsletter", 0.01 ether, 30 days);
        createPlan("Premium Content", 0.05 ether, 30 days);
        createPlan("VIP Access", 0.1 ether, 30 days);
    }
    
    function createPlan(string memory title, uint256 price, uint256 duration) public onlyOwner {
        planCount++;
        plans[planCount] = SubscriptionPlan({
            price: price,
            duration: duration,
            title: title,
            active: true
        });
        
        emit PlanCreated(planCount, title, price, duration);
    }
    
    function subscribe(uint256 planId) external payable {
        require(planId > 0 && planId <= planCount, "Invalid plan");
        require(plans[planId].active, "Plan not active");
        require(msg.value >= plans[planId].price, "Insufficient payment");
        
        uint256 expiresAt = block.timestamp + plans[planId].duration;
        
        subscriptions[msg.sender] = Subscription({
            planId: planId,
            expiresAt: expiresAt,
            active: true
        });
        
        emit Subscribed(msg.sender, planId, expiresAt);
        
        // Refund excess payment
        if (msg.value > plans[planId].price) {
            payable(msg.sender).transfer(msg.value - plans[planId].price);
        }
    }
    
    function renewSubscription() external payable {
        Subscription storage sub = subscriptions[msg.sender];
        require(sub.active, "No active subscription");
        require(msg.value >= plans[sub.planId].price, "Insufficient payment");
        
        sub.expiresAt = block.timestamp + plans[sub.planId].duration;
        
        emit Subscribed(msg.sender, sub.planId, sub.expiresAt);
        
        // Refund excess payment
        if (msg.value > plans[sub.planId].price) {
            payable(msg.sender).transfer(msg.value - plans[sub.planId].price);
        }
    }
    
    function cancelSubscription() external {
        Subscription storage sub = subscriptions[msg.sender];
        require(sub.active, "No active subscription");
        
        uint256 planId = sub.planId;
        sub.active = false;
        sub.expiresAt = block.timestamp; // immediately expire
        
        emit SubscriptionCancelled(msg.sender, planId, block.timestamp);
    }
    
    function getSubscriptionStatus(address subscriber) external view returns (bool isActive, uint256 expiresAt, uint256 planId) {
        Subscription memory sub = subscriptions[subscriber];
        return (
            sub.active && sub.expiresAt > block.timestamp,
            sub.expiresAt,
            sub.planId
        );
    }
    
    function getSubscriptionPlan(uint256 planId) external view returns (uint256 price, uint256 duration, string memory title) {
        require(planId > 0 && planId <= planCount, "Invalid plan");
        SubscriptionPlan memory plan = plans[planId];
        return (plan.price, plan.duration, plan.title);
    }
    
    function withdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
}
