package com.techfiyr.web;

import com.techfiyr.cms.*;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.List;

@Controller
@RequestMapping("/admin/pages")
public class AdminPageController {
    private final CmsPageService pageService;

    public AdminPageController(CmsPageService pageService) {
        this.pageService = pageService;
    }

    @GetMapping
    public String pages(Model model) {
        model.addAttribute("pages", pageService.findAll());
        return "admin/pages";
    }

    @GetMapping("/{slug}/edit")
    public String edit(@PathVariable String slug, Model model) {
        CmsPage page = pageService.requireBySlug(slug);
        List<EditableField> fields = pageService.fieldsFor(slug);
        model.addAttribute("page", page);
        model.addAttribute("fields", fields);
        model.addAttribute("fieldCount", fields.size());
        return "admin/page-edit";
    }

    @PostMapping("/{slug}")
    public String update(@PathVariable String slug,
                         PageUpdateForm form,
                         Authentication authentication,
                         RedirectAttributes redirectAttributes) {
        try {
            pageService.update(slug, form, authentication.getName());
            redirectAttributes.addFlashAttribute("success", "Page content saved.");
        } catch (IllegalArgumentException exception) {
            redirectAttributes.addFlashAttribute("error", exception.getMessage());
        }
        return "redirect:/admin/pages/" + slug + "/edit";
    }

    @PostMapping("/{slug}/reset")
    public String reset(@PathVariable String slug,
                        Authentication authentication,
                        RedirectAttributes redirectAttributes) {
        pageService.reset(slug, authentication.getName());
        redirectAttributes.addFlashAttribute("success", "The page was restored from its original static file.");
        return "redirect:/admin/pages/" + slug + "/edit";
    }
}
