package com.techfiyr.web;

import com.techfiyr.dashboard.AdminDashboardService;
import com.techfiyr.dashboard.DashboardStats;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/admin")
public class AdminDashboardController {
    private final AdminDashboardService dashboardService;

    public AdminDashboardController(AdminDashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping
    public String dashboard(Model model) {
        DashboardStats stats = dashboardService.getStats();
        model.addAttribute("pageCount", stats.pageCount());
        model.addAttribute("userCount", stats.userCount());
        model.addAttribute("newMessageCount", stats.newMessageCount());
        model.addAttribute("mediaCount", stats.mediaCount());
        return "admin/dashboard";
    }
}
