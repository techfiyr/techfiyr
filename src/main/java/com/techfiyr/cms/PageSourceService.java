package com.techfiyr.cms;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.DataNode;
import org.jsoup.nodes.Element;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class PageSourceService {
    private static final Pattern LEGACY_COUNTDOWN_SETUP = Pattern.compile(
            "// Set launch date: 45 days from now\\s*"
                    + "const targetDate = new Date\\(\\);\\s*"
                    + "targetDate\\.setDate\\(targetDate\\.getDate\\(\\) \\+ 45\\);\\s*"
                    + "targetDate\\.setHours\\(targetDate\\.getHours\\(\\) \\+ 14\\);"
    );
    private final CmsContentEditor editor;

    public PageSourceService(CmsContentEditor editor) {
        this.editor = editor;
    }

    public String loadPrepared(PageDefinition definition) {
        try {
            ClassPathResource resource = new ClassPathResource("cms-pages/" + definition.sourceFile());
            String html = resource.getContentAsString(StandardCharsets.UTF_8);
            return editor.prepareForCms(addApplicationFeatures(html, definition.slug()));
        } catch (IOException exception) {
            throw new IllegalStateException("Could not load " + definition.sourceFile(), exception);
        }
    }

    public String upgradeStoredContent(String html, String slug) {
        Document document = Jsoup.parse(html);
        document.outputSettings().prettyPrint(false);
        boolean changed = !document.select(".cms-account-controls").isEmpty();
        document.select(".cms-account-controls").remove();

        if (!slug.equals("coming-soon")) {
            return changed ? document.outerHtml() : html;
        }
        Element countdown = document.selectFirst("#csCountdown");
        if (countdown == null) {
            return changed ? document.outerHtml() : html;
        }
        if (!countdown.hasAttr("data-launch-days")) {
            countdown.attr("data-launch-days", "45");
            changed = true;
        }
        if (!countdown.hasAttr("data-launch-hours")) {
            countdown.attr("data-launch-hours", "14");
            changed = true;
        }
        for (Element script : document.select("script:not([src])")) {
            Matcher matcher = LEGACY_COUNTDOWN_SETUP.matcher(script.data());
            if (matcher.find()) {
                String replacement = """
                        // Launch timing is managed from the CMS
                        const countdown = document.getElementById('csCountdown');
                        const launchDays = Number(countdown.dataset.launchDays || 45);
                        const launchHours = Number(countdown.dataset.launchHours || 14);
                        const targetDate = new Date();
                        targetDate.setDate(targetDate.getDate() + launchDays);
                        targetDate.setHours(targetDate.getHours() + launchHours);""";
                String upgradedScript = matcher.replaceFirst(Matcher.quoteReplacement(replacement));
                script.empty().appendChild(new DataNode(upgradedScript));
                changed = true;
                break;
            }
        }
        return changed ? document.outerHtml() : html;
    }

    private String addApplicationFeatures(String html, String slug) {
        Document document = Jsoup.parse(html);
        document.outputSettings().prettyPrint(false);
        document.documentType();
        document.selectFirst("html").attr("xmlns:th", "http://www.thymeleaf.org");

        makeNonApplicationFormsSafe(document);
        if (slug.equals("contact")) {
            connectContactForm(document);
        }
        return document.outerHtml();
    }

    private void connectContactForm(Document document) {
        Element form = document.selectFirst(".contact-form form");
        if (form == null) return;
        form.attr("action", "/contact").attr("method", "post").removeAttr("onsubmit");
        Element firstName = form.selectFirst("input[name=username]");
        Element lastName = form.selectFirst("input[name=lastname]");
        Element email = form.selectFirst("input[type=email]");
        Element subject = form.selectFirst("input[name=services]");
        Element message = form.selectFirst("textarea");
        if (firstName != null) firstName.attr("name", "firstName").attr("maxlength", "100");
        if (lastName != null) lastName.attr("name", "lastName").attr("maxlength", "100");
        if (email != null) email.attr("name", "email").attr("maxlength", "254");
        if (subject != null) subject.attr("name", "subject").attr("maxlength", "180");
        if (message != null) message.attr("name", "message").attr("maxlength", "5000").attr("required", "");
        form.prepend("<input type=\"hidden\" th:name=\"${csrfParameterName}\" th:value=\"${csrfToken}\" data-cms-system>");
        form.before("<div class=\"alert alert-success\" th:if=\"${sent}\" data-cms-system>Thank you. Your message has been received.</div>");
        form.before("<div class=\"alert alert-danger\" th:if=\"${formError}\" data-cms-system>Please complete all required fields with a valid email address.</div>");
    }

    private void makeNonApplicationFormsSafe(Document document) {
        for (Element form : document.select("form[method=post]")) {
            if (form.attr("action").isBlank() || form.attr("action").equals("#")) {
                form.attr("method", "get").attr("action", "/");
            }
        }
    }
}
