package com.techfiyr.web;

import com.techfiyr.user.UserManagementService;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/employee")
public class EmployeeController {
    private final UserManagementService userService;

    public EmployeeController(UserManagementService userService) {
        this.userService = userService;
    }

    @GetMapping
    public String dashboard(Authentication authentication, Model model) {
        model.addAttribute("user", userService.requireByUsername(authentication.getName()));
        return "employee/dashboard";
    }
}
