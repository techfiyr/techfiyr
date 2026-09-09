package com.techfiyr.web;

import com.techfiyr.cms.CmsRenderService;
import com.techfiyr.contact.ContactForm;
import com.techfiyr.contact.ContactService;
import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.boot.web.servlet.error.ErrorController;

@Controller
public class PublicPageController implements ErrorController {
    private final CmsRenderService renderService;
    private final ContactService contactService;

    public PublicPageController(CmsRenderService renderService, ContactService contactService) {
        this.renderService = renderService;
        this.contactService = contactService;
    }

    @GetMapping(value = {"/", "/index", "/index.html"}, produces = MediaType.TEXT_HTML_VALUE)
    @ResponseBody
    public String home(HttpServletRequest request) {
        return renderService.render("home", request);
    }

    @GetMapping(value = {"/about", "/about.html"}, produces = MediaType.TEXT_HTML_VALUE)
    @ResponseBody
    public String about(HttpServletRequest request) {
        return renderService.render("about", request);
    }

    @GetMapping(value = {"/contact", "/contact.html"}, produces = MediaType.TEXT_HTML_VALUE)
    @ResponseBody
    public String contact(HttpServletRequest request) {
        return renderService.render("contact", request);
    }

    @PostMapping("/contact")
    public String submitContact(@Valid ContactForm form, BindingResult bindingResult) {
        if (bindingResult.hasErrors()) return "redirect:/contact?error=1";
        contactService.submit(form, "contact-page");
        return "redirect:/contact?sent=1";
    }

    @GetMapping(value = {"/team", "/team-detail.html"}, produces = MediaType.TEXT_HTML_VALUE)
    @ResponseBody
    public String team(HttpServletRequest request) {
        return renderService.render("team", request);
    }

    @GetMapping(value = {"/coming-soon", "/coming-soon.html"}, produces = MediaType.TEXT_HTML_VALUE)
    @ResponseBody
    public String comingSoon(HttpServletRequest request) {
        return renderService.render("coming-soon", request);
    }

    @GetMapping(value = {"/not-found", "/not-found.html"}, produces = MediaType.TEXT_HTML_VALUE)
    @ResponseBody
    public String notFound(HttpServletRequest request) {
        return renderService.render("not-found", request);
    }

    @RequestMapping(value = "/error", produces = MediaType.TEXT_HTML_VALUE)
    @ResponseBody
    public ResponseEntity<String> error(HttpServletRequest request) {
        Object statusValue = request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);
        HttpStatus status = HttpStatus.INTERNAL_SERVER_ERROR;
        if (statusValue != null) {
            try {
                status = HttpStatus.valueOf(Integer.parseInt(statusValue.toString()));
            } catch (IllegalArgumentException ignored) {
                // Keep 500 for an unknown status.
            }
        }
        return ResponseEntity.status(status).body(renderService.render("not-found", request));
    }
}
