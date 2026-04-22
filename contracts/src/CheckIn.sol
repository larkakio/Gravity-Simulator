// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Daily on-chain check-in for Base. No fee — user pays only L2 gas.
contract CheckIn {
    mapping(address => uint256) public lastCheckInAt;
    mapping(address => uint256) public streak;

    event CheckedIn(address indexed user, uint256 indexed day, uint256 streakCount);

    function checkIn() external payable {
        require(msg.value == 0, "CheckIn: ETH not accepted");

        uint256 day = block.timestamp / 1 days;
        uint256 prevTs = lastCheckInAt[msg.sender];
        if (prevTs != 0) {
            uint256 prevDay = prevTs / 1 days;
            require(prevDay != day, "CheckIn: already checked in today");
        }

        uint256 prevDayForStreak = prevTs == 0 ? 0 : prevTs / 1 days;
        uint256 newStreak;
        if (prevTs == 0) {
            newStreak = 1;
        } else if (prevDayForStreak == day - 1) {
            newStreak = streak[msg.sender] + 1;
        } else {
            newStreak = 1;
        }

        streak[msg.sender] = newStreak;
        lastCheckInAt[msg.sender] = block.timestamp;

        emit CheckedIn(msg.sender, day, newStreak);
    }
}
