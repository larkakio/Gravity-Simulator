// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {CheckIn} from "../src/CheckIn.sol";

contract CheckInTest is Test {
    CheckIn public c;
    address public alice = address(0xA11CE);

    function setUp() public {
        c = new CheckIn();
    }

    function test_checkIn_firstTime() public {
        vm.warp(1_700_000_000);
        vm.prank(alice);
        c.checkIn();
        assertEq(c.lastCheckInAt(alice), block.timestamp);
        assertEq(c.streak(alice), 1);
    }

    function test_checkIn_revertsWithValue() public {
        vm.deal(alice, 1 ether);
        vm.prank(alice);
        vm.expectRevert(bytes("CheckIn: ETH not accepted"));
        c.checkIn{value: 1 wei}();
    }

    function test_checkIn_twiceSameDay_reverts() public {
        vm.warp(1_700_000_000);
        vm.startPrank(alice);
        c.checkIn();
        vm.expectRevert(bytes("CheckIn: already checked in today"));
        c.checkIn();
        vm.stopPrank();
    }

    function test_checkIn_nextDay_incrementsStreak() public {
        vm.warp(1_700_000_000);
        vm.startPrank(alice);
        c.checkIn();
        vm.warp(block.timestamp + 1 days);
        c.checkIn();
        vm.stopPrank();
        assertEq(c.streak(alice), 2);
    }

    function test_checkIn_skipDay_resetsStreak() public {
        vm.warp(1_700_000_000);
        vm.startPrank(alice);
        c.checkIn();
        vm.warp(block.timestamp + 2 days);
        c.checkIn();
        vm.stopPrank();
        assertEq(c.streak(alice), 1);
    }
}
