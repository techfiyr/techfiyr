package com.techfiyr.cms;

import org.junit.jupiter.api.Test;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.nodes.TextNode;

import java.util.List;

import static org.assertj.core.api.Assertions.*;

class CmsContentEditorTest {
    private final CmsContentEditor editor = new CmsContentEditor();
    private final PageSourceService sourceService = new PageSourceService(editor);

    @Test
    void extractsAndSafelyUpdatesTextImagesLinksAndNumbers() {
        String prepared = editor.prepareForCms("""
                <html><head><title>Example</title></head><body>
                <h1>Hello <span>world</span></h1>
                <img src="/old.jpg" srcset="/old-small.jpg 480w, /old.jpg 960w" alt="">
                <a href="/about">About</a>
                <span data-stop="42">42</span>
                <button aria-label="Open menu">Menu</button>
                <input type="text" value="Default value" placeholder="Your name">
                <div data-width="75" style="background-image:url('/hero.jpg'), url('/texture.png')"></div>
                </body></html>
                """);

        List<EditableField> fields = editor.extractFields(prepared);
        assertThat(fields).extracting(EditableField::type)
                .contains(FieldType.SHORT_TEXT, FieldType.IMAGE, FieldType.LINK, FieldType.NUMBER);
        assertThat(fields).extracting(EditableField::value)
                .contains("", "Open menu", "Default value", "Your name", "75", "/texture.png");

        EditableField hello = fields.stream().filter(field -> field.value().equals("Hello")).findFirst().orElseThrow();
        String updated = editor.applyUpdates(prepared, List.of(hello.key()), List.of("Welcome"));
        assertThat(updated).contains("Welcome <span").doesNotContain(">Hello <");
    }

    @Test
    void rejectsExecutableUrls() {
        String prepared = editor.prepareForCms("<html><body><a href=\"/safe\">Safe</a></body></html>");
        EditableField link = editor.extractFields(prepared).stream()
                .filter(field -> field.type() == FieldType.LINK).findFirst().orElseThrow();

        assertThatThrownBy(() -> editor.applyUpdates(prepared, List.of(link.key()), List.of("javascript:alert(1)")))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void excludesApplicationControlsFromCmsFields() {
        String prepared = editor.prepareForCms("<html><body><div data-cms-system><span>Logout</span></div><p>Editable</p></body></html>");
        assertThat(editor.extractFields(prepared)).extracting(EditableField::value)
                .contains("Editable")
                .doesNotContain("Logout");
    }

    @Test
    void addsMissingMarkersWithoutChangingExistingOnes() {
        String synchronizedHtml = editor.synchronizeEditableMarkers("""
                <html><body>
                <p data-cms-id="cms-20">Already editable</p>
                <p>New content</p>
                <img src="/image.jpg" alt="">
                </body></html>
                """);

        assertThat(synchronizedHtml).contains("data-cms-id=\"cms-20\"")
                .contains("data-cms-id=\"cms-21\"")
                .contains("data-cms-id=\"cms-22\"");
        assertThat(editor.extractFields(synchronizedHtml)).extracting(EditableField::value)
                .contains("Already editable", "New content", "/image.jpg", "");
    }

    @Test
    void updatesTheRequestedBackgroundImageWithoutChangingTheOtherOne() {
        String prepared = editor.prepareForCms("""
                <html><body><div style="background-image:url('/first.jpg'), url('/second.jpg')"></div></body></html>
                """);
        EditableField secondImage = editor.extractFields(prepared).stream()
                .filter(field -> field.value().equals("/second.jpg"))
                .findFirst()
                .orElseThrow();

        String updated = editor.applyUpdates(prepared, List.of(secondImage.key()), List.of("/new-second.jpg"));

        assertThat(updated).contains("url('/first.jpg')", "url('/new-second.jpg')")
                .doesNotContain("/second.jpg");
    }

    @Test
    void doesNotExposeStylesheetPathsAsPageContent() {
        String prepared = editor.prepareForCms("""
                <html><head><link rel="stylesheet" href="/style.css"><link rel="icon" href="/icon.png"></head></html>
                """);

        assertThat(editor.extractFields(prepared)).extracting(EditableField::value)
                .contains("/icon.png")
                .doesNotContain("/style.css");
    }

    @Test
    void upgradesLegacyCountdownTimingIntoEditableBackendValues() {
        String legacyHtml = """
                <html><body>
                <div id="csCountdown"></div>
                <script>
                // Set launch date: 45 days from now
                const targetDate = new Date();
                targetDate.setDate(targetDate.getDate() + 45);
                targetDate.setHours(targetDate.getHours() + 14);
                </script>
                </body></html>
                """;

        String upgraded = editor.synchronizeEditableMarkers(
                sourceService.upgradeStoredContent(legacyHtml, "coming-soon")
        );

        assertThat(upgraded).contains("data-launch-days=\"45\"", "data-launch-hours=\"14\"")
                .contains("countdown.dataset.launchDays", "countdown.dataset.launchHours");
        assertThat(editor.extractFields(upgraded)).extracting(EditableField::value)
                .contains("45", "14");
    }

    @Test
    void removesLegacyPublicLoginAndDashboardControlsWithoutChangingPageContent() {
        String legacyHtml = """
                <html><body>
                <header><div class="cms-account-controls" data-cms-system>
                  <a href="/login">Login</a><a href="/dashboard">Dashboard</a>
                </div></header>
                <main><h1>Keep this content</h1></main>
                </body></html>
                """;

        String upgraded = sourceService.upgradeStoredContent(legacyHtml, "home");

        assertThat(upgraded).contains("Keep this content")
                .doesNotContain("cms-account-controls", ">Login<", ">Dashboard<");
    }

    @Test
    void everyStaticPageMarksAllVisibleContentForBackendEditing() {
        String contentSelector = String.join(", ",
                "img[src]", "img[alt]", "source[src]", "video[poster]", "a[href]",
                "link[rel~=icon][href]", "[style*=background]", "meta[content]",
                "input[placeholder]", "[aria-label]", "[data-count]", "[data-stop]",
                "[data-width]", "[data-launch-days]", "[data-launch-hours]"
        );

        for (PageDefinition definition : CmsPageService.PAGE_DEFINITIONS) {
            String prepared = sourceService.loadPrepared(definition);
            Document document = Jsoup.parse(prepared);
            assertThat(editor.extractFields(prepared))
                    .as("editable fields for %s", definition.sourceFile())
                    .hasSizeGreaterThan(25);

            for (Element element : document.getAllElements()) {
                boolean excluded = element.closest("script, style, noscript, [data-cms-system]") != null;
                if (excluded) {
                    continue;
                }
                boolean hasVisibleText = element.childNodes().stream()
                        .anyMatch(node -> node instanceof TextNode text && !text.getWholeText().isBlank());
                if (hasVisibleText || element.is(contentSelector)) {
                    assertThat(element.hasAttr("data-cms-id"))
                            .as("CMS marker on <%s> in %s", element.normalName(), definition.sourceFile())
                            .isTrue();
                }
            }
        }
    }
}
