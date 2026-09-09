package com.techfiyr.web;

import com.techfiyr.media.MediaService;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/admin/media")
public class AdminMediaController {
    private final MediaService mediaService;

    public AdminMediaController(MediaService mediaService) {
        this.mediaService = mediaService;
    }

    @GetMapping
    public String media(Model model) {
        model.addAttribute("assets", mediaService.findAll());
        return "admin/media";
    }

    @PostMapping
    public String upload(@RequestParam("file") MultipartFile file,
                         Authentication authentication,
                         RedirectAttributes redirectAttributes) {
        try {
            var asset = mediaService.upload(file, authentication.getName());
            redirectAttributes.addFlashAttribute("success", "Image uploaded. Copy this path into any image field: " + asset.getPublicPath());
        } catch (RuntimeException exception) {
            redirectAttributes.addFlashAttribute("error", exception.getMessage());
        }
        return "redirect:/admin/media";
    }
}
