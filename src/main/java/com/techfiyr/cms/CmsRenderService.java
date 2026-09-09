package com.techfiyr.cms;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.templatemode.TemplateMode;
import org.thymeleaf.templateresolver.StringTemplateResolver;

@Service
public class CmsRenderService {
    private final CmsPageService pageService;
    private final SpringTemplateEngine templateEngine;

    public CmsRenderService(CmsPageService pageService) {
        this.pageService = pageService;
        StringTemplateResolver resolver = new StringTemplateResolver();
        resolver.setTemplateMode(TemplateMode.HTML);
        resolver.setCacheable(false);
        this.templateEngine = new SpringTemplateEngine();
        this.templateEngine.setTemplateResolver(resolver);
    }

    public String render(String slug, HttpServletRequest request) {
        CmsPage page = pageService.requirePublished(slug);
        CsrfToken csrf = (CsrfToken) request.getAttribute(CsrfToken.class.getName());

        Context context = new Context(request.getLocale());
        context.setVariable("csrfParameterName", csrf == null ? "_csrf" : csrf.getParameterName());
        context.setVariable("csrfToken", csrf == null ? "" : csrf.getToken());
        context.setVariable("sent", request.getParameter("sent") != null);
        context.setVariable("formError", request.getParameter("error") != null);
        return templateEngine.process(page.getHtmlContent(), context);
    }
}
