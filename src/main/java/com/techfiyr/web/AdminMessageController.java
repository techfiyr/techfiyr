package com.techfiyr.web;

import com.techfiyr.contact.ContactService;
import com.techfiyr.contact.SubmissionStatus;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/admin/messages")
public class AdminMessageController {
    private final ContactService contactService;

    public AdminMessageController(ContactService contactService) {
        this.contactService = contactService;
    }

    @GetMapping
    public String messages(Model model) {
        model.addAttribute("messages", contactService.findAll());
        model.addAttribute("statuses", SubmissionStatus.values());
        return "admin/messages";
    }

    @PostMapping("/{id}/status")
    public String status(@PathVariable Long id,
                         @RequestParam SubmissionStatus status,
                         RedirectAttributes redirectAttributes) {
        contactService.setStatus(id, status);
        redirectAttributes.addFlashAttribute("success", "Message status updated.");
        return "redirect:/admin/messages";
    }
}
