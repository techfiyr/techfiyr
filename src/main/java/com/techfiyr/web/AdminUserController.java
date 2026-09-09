package com.techfiyr.web;

import com.techfiyr.user.CreateUserForm;
import com.techfiyr.user.Role;
import com.techfiyr.user.UserManagementService;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/admin/users")
public class AdminUserController {
    private final UserManagementService userService;

    public AdminUserController(UserManagementService userService) {
        this.userService = userService;
    }

    @GetMapping
    public String users(Model model) {
        if (!model.containsAttribute("createUserForm")) {
            model.addAttribute("createUserForm", new CreateUserForm());
        }
        model.addAttribute("users", userService.findAll());
        model.addAttribute("roles", Role.values());
        return "admin/users";
    }

    @PostMapping
    public String create(@Valid @ModelAttribute CreateUserForm createUserForm,
                         BindingResult bindingResult,
                         RedirectAttributes redirectAttributes) {
        if (bindingResult.hasErrors()) {
            redirectAttributes.addFlashAttribute("org.springframework.validation.BindingResult.createUserForm", bindingResult);
            redirectAttributes.addFlashAttribute("createUserForm", createUserForm);
            return "redirect:/admin/users";
        }
        try {
            userService.create(createUserForm);
            redirectAttributes.addFlashAttribute("success", "User created.");
        } catch (IllegalArgumentException exception) {
            redirectAttributes.addFlashAttribute("error", exception.getMessage());
        }
        return "redirect:/admin/users";
    }

    @PostMapping("/{id}/toggle")
    public String toggle(@PathVariable Long id, Authentication authentication, RedirectAttributes redirectAttributes) {
        try {
            userService.toggleEnabled(id, authentication.getName());
            redirectAttributes.addFlashAttribute("success", "User status updated.");
        } catch (IllegalArgumentException exception) {
            redirectAttributes.addFlashAttribute("error", exception.getMessage());
        }
        return "redirect:/admin/users";
    }

    @PostMapping("/{id}/password")
    public String password(@PathVariable Long id,
                           @RequestParam String password,
                           RedirectAttributes redirectAttributes) {
        try {
            userService.resetPassword(id, password);
            redirectAttributes.addFlashAttribute("success", "Password updated.");
        } catch (IllegalArgumentException exception) {
            redirectAttributes.addFlashAttribute("error", exception.getMessage());
        }
        return "redirect:/admin/users";
    }
}
