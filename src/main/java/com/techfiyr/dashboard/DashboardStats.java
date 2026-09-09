package com.techfiyr.dashboard;

public record DashboardStats(
        long pageCount,
        long userCount,
        long newMessageCount,
        long mediaCount
) {
}
