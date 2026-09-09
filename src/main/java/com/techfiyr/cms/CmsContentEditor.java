package com.techfiyr.cms;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Attribute;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.nodes.Node;
import org.jsoup.nodes.TextNode;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class CmsContentEditor {
    private static final Set<String> CONTENT_ATTRIBUTES = Set.of(
            "src", "srcset", "href", "alt", "title", "placeholder", "poster", "content",
            "value", "aria-label", "aria-description", "datetime", "cite",
            "data-src", "data-background", "data-count", "data-stop", "data-speed", "data-width",
            "data-text", "data-title", "data-subtitle", "data-caption", "data-label", "data-description",
            "data-launch-days", "data-launch-hours"
    );
    private static final Set<String> EXCLUDED_TAGS = Set.of("script", "style", "noscript", "path");
    private static final Pattern BACKGROUND_DECLARATION = Pattern.compile("(?i)background(?:-image)?\\s*:");
    private static final Pattern STYLE_URL = Pattern.compile("(?i)(url\\(\\s*['\"]?)([^'\")]+)(['\"]?\\s*\\))");
    private static final Pattern CMS_ID = Pattern.compile("cms-(\\d+)");
    private static final Pattern SAFE_KEY = Pattern.compile(
            "cms-\\d+\\|(text\\|\\d+|attr\\|[a-z0-9:-]+|style-url\\|\\d+|style-bg)"
    );

    public String prepareForCms(String html) {
        Document document = parse(html);
        addMissingMarkers(document);
        return document.outerHtml();
    }

    public String synchronizeEditableMarkers(String html) {
        return prepareForCms(html);
    }

    public List<EditableField> extractFields(String html) {
        Document document = parse(html);
        addMissingMarkers(document);
        List<EditableField> fields = new ArrayList<>();
        for (Element element : document.select("[data-cms-id]")) {
            if (isSystemOrExcluded(element)) {
                continue;
            }
            String id = element.attr("data-cms-id");
            String section = findSection(element);
            int textIndex = 0;
            for (Node child : element.childNodes()) {
                if (child instanceof TextNode textNode && !textNode.getWholeText().isBlank()) {
                    String value = textNode.getWholeText().strip();
                    fields.add(new EditableField(
                            id + "|text|" + textIndex,
                            describe(element, "Text", value),
                            value,
                            inferTextType(element, value),
                            section
                    ));
                }
                if (child instanceof TextNode) {
                    textIndex++;
                }
            }

            for (Attribute attribute : element.attributes()) {
                String name = attribute.getKey().toLowerCase(Locale.ROOT);
                if (isEditableAttribute(element, name)) {
                    fields.add(new EditableField(
                            id + "|attr|" + name,
                            describe(element, attributeLabel(name), attribute.getValue()),
                            attribute.getValue(),
                            attributeType(element, name, attribute.getValue()),
                            section
                    ));
                }
            }

            List<String> backgroundImages = backgroundImages(element);
            for (int backgroundIndex = 0; backgroundIndex < backgroundImages.size(); backgroundIndex++) {
                String value = backgroundImages.get(backgroundIndex);
                fields.add(new EditableField(
                        id + "|style-url|" + backgroundIndex,
                        describe(element, "Background image", value),
                        value,
                        FieldType.IMAGE,
                        section
                ));
            }
        }
        return fields;
    }

    public String applyUpdates(String html, List<String> keys, List<String> values) {
        if (keys == null || values == null || keys.size() != values.size()) {
            throw new IllegalArgumentException("The submitted content fields are incomplete.");
        }
        Document document = parse(html);
        Map<String, Element> elements = new HashMap<>();
        for (Element element : document.select("[data-cms-id]")) {
            elements.put(element.attr("data-cms-id"), element);
        }

        for (int i = 0; i < keys.size(); i++) {
            String key = keys.get(i);
            String value = values.get(i) == null ? "" : values.get(i);
            if (key == null || !SAFE_KEY.matcher(key).matches()) {
                throw new IllegalArgumentException("Invalid content field.");
            }
            String[] parts = key.split("\\|");
            Element element = elements.get(parts[0]);
            if (element == null || isSystemOrExcluded(element)) {
                throw new IllegalArgumentException("A content field no longer exists. Reload the page and try again.");
            }

            switch (parts[1]) {
                case "text" -> updateText(element, Integer.parseInt(parts[2]), value);
                case "attr" -> updateAttribute(element, parts[2], value);
                case "style-url" -> updateBackground(element, Integer.parseInt(parts[2]), value);
                case "style-bg" -> updateBackground(element, 0, value);
                default -> throw new IllegalArgumentException("Unsupported content field.");
            }
        }
        return document.outerHtml();
    }

    private void addMissingMarkers(Document document) {
        Set<String> assignedIds = new HashSet<>();
        int nextId = document.select("[data-cms-id]").stream()
                .map(element -> CMS_ID.matcher(element.attr("data-cms-id")))
                .filter(Matcher::matches)
                .mapToInt(matcher -> Integer.parseInt(matcher.group(1)))
                .max()
                .orElse(0) + 1;

        for (Element element : document.getAllElements()) {
            if (isSystemOrExcluded(element) || !hasEditableContent(element)) {
                continue;
            }
            String currentId = element.attr("data-cms-id");
            if (CMS_ID.matcher(currentId).matches() && assignedIds.add(currentId)) {
                continue;
            }
            String newId;
            do {
                newId = "cms-" + nextId++;
            } while (!assignedIds.add(newId));
            element.attr("data-cms-id", newId);
        }
    }

    private void updateText(Element element, int wantedIndex, String value) {
        int index = 0;
        for (Node child : element.childNodes()) {
            if (child instanceof TextNode textNode) {
                if (index == wantedIndex) {
                    String old = textNode.getWholeText();
                    textNode.text(leadingWhitespace(old) + value.strip() + trailingWhitespace(old));
                    return;
                }
                index++;
            }
        }
        throw new IllegalArgumentException("A text field no longer exists. Reload the page and try again.");
    }

    private void updateAttribute(Element element, String name, String value) {
        if (!isEditableAttribute(element, name)) {
            throw new IllegalArgumentException("This attribute cannot be edited.");
        }
        if (requiresSafeUrl(element, name)) {
            requireSafeUrl(value);
        }
        element.attr(name, value.strip());
    }

    private void updateBackground(Element element, int wantedIndex, String value) {
        requireSafeUrl(value);
        String style = element.attr("style");
        if (!BACKGROUND_DECLARATION.matcher(style).find()) {
            throw new IllegalArgumentException("A background image field no longer exists.");
        }
        Matcher matcher = STYLE_URL.matcher(style);
        StringBuilder updated = new StringBuilder();
        int index = 0;
        boolean found = false;
        while (matcher.find()) {
            if (index++ == wantedIndex) {
                matcher.appendReplacement(updated, Matcher.quoteReplacement(
                        matcher.group(1) + value.strip() + matcher.group(3)
                ));
                found = true;
            }
        }
        matcher.appendTail(updated);
        if (!found) {
            throw new IllegalArgumentException("A background image field no longer exists.");
        }
        element.attr("style", updated.toString());
    }

    private void requireSafeUrl(String raw) {
        for (String candidate : raw.split(",")) {
            String value = candidate.strip().split("\\s+", 2)[0].toLowerCase(Locale.ROOT);
            if (value.startsWith("javascript:") || value.startsWith("data:") || value.startsWith("vbscript:")) {
                throw new IllegalArgumentException("Only relative paths and http(s), mailto, or telephone links are allowed.");
            }
        }
    }

    private boolean hasEditableContent(Element element) {
        boolean text = element.childNodes().stream()
                .anyMatch(node -> node instanceof TextNode textNode && !textNode.getWholeText().isBlank());
        boolean attributes = element.attributes().asList().stream()
                .anyMatch(attribute -> isEditableAttribute(element, attribute.getKey().toLowerCase(Locale.ROOT)));
        return text || attributes || !backgroundImages(element).isEmpty();
    }

    private boolean isEditableAttribute(Element element, String name) {
        if (!CONTENT_ATTRIBUTES.contains(name)) {
            return false;
        }
        if (name.equals("href")) {
            return Set.of("a", "area").contains(element.normalName())
                    || element.normalName().equals("link")
                    && element.attr("rel").toLowerCase(Locale.ROOT).contains("icon");
        }
        if (name.equals("value") && element.normalName().equals("input")) {
            return !element.attr("type").equalsIgnoreCase("hidden");
        }
        return true;
    }

    private boolean requiresSafeUrl(Element element, String name) {
        if (Set.of("src", "srcset", "href", "poster", "cite", "data-src", "data-background").contains(name)) {
            return true;
        }
        return name.equals("content") && element.normalName().equals("meta")
                && (element.attr("property").toLowerCase(Locale.ROOT).contains("image")
                || element.attr("name").toLowerCase(Locale.ROOT).contains("image"));
    }

    private List<String> backgroundImages(Element element) {
        String style = element.attr("style");
        if (!BACKGROUND_DECLARATION.matcher(style).find()) {
            return List.of();
        }
        List<String> images = new ArrayList<>();
        Matcher matcher = STYLE_URL.matcher(style);
        while (matcher.find()) {
            images.add(matcher.group(2));
        }
        return images;
    }

    private boolean isSystemOrExcluded(Element element) {
        return EXCLUDED_TAGS.contains(element.normalName())
                || element.closest("script, style, noscript") != null
                || element.closest("[data-cms-system]") != null;
    }

    private FieldType inferTextType(Element element, String value) {
        if (value.matches("[-+]?\\d+(?:[.,]\\d+)?%?")) {
            return FieldType.NUMBER;
        }
        if (value.length() > 90 || Set.of("p", "textarea").contains(element.normalName())) {
            return FieldType.LONG_TEXT;
        }
        return FieldType.SHORT_TEXT;
    }

    private FieldType attributeType(Element element, String name, String value) {
        boolean iconLink = name.equals("href") && element.normalName().equals("link");
        boolean imageMetadata = name.equals("content") && element.normalName().equals("meta")
                && (element.attr("property").toLowerCase(Locale.ROOT).contains("image")
                || element.attr("name").toLowerCase(Locale.ROOT).contains("image"));
        boolean mediaPath = Set.of("src", "srcset", "poster", "data-src", "data-background").contains(name)
                && !element.normalName().equals("iframe");
        if (mediaPath || iconLink || imageMetadata) {
            return FieldType.IMAGE;
        }
        if (Set.of("href", "src", "cite").contains(name)) {
            return FieldType.LINK;
        }
        if ((name.startsWith("data-") || name.equals("value"))
                && value.matches("[-+]?\\d+(?:[.,]\\d+)?%?")) {
            return FieldType.NUMBER;
        }
        return value.length() > 90 ? FieldType.LONG_TEXT : FieldType.SHORT_TEXT;
    }

    private String findSection(Element element) {
        Element cursor = element;
        while (cursor != null) {
            Element heading = cursor.children().stream()
                    .filter(child -> Set.of("h1", "h2", "h3").contains(child.normalName()))
                    .findFirst()
                    .orElse(null);
            if (heading != null && !heading.text().isBlank()) {
                return abbreviate(heading.text(), 55);
            }
            if (!cursor.id().isBlank()) {
                return humanize(cursor.id());
            }
            cursor = cursor.parent();
        }
        return element.normalName().equals("title") ? "Page metadata" : "General content";
    }

    private String describe(Element element, String kind, String value) {
        String context = element.normalName();
        if (!element.id().isBlank()) {
            context += " #" + element.id();
        } else if (!element.className().isBlank()) {
            context += " ." + element.className().split("\\s+")[0];
        }
        return kind + " — " + context + " — " + abbreviate(value, 50);
    }

    private String attributeLabel(String name) {
        return switch (name) {
            case "src", "srcset", "poster", "data-src", "data-background" -> "Media path";
            case "href", "cite" -> "Link URL";
            case "alt" -> "Image description";
            case "placeholder" -> "Form placeholder";
            case "content" -> "Metadata";
            case "aria-label", "aria-description" -> "Accessibility text";
            case "value" -> "Form value";
            case "datetime" -> "Date/time";
            default -> humanize(name);
        };
    }

    private String abbreviate(String value, int length) {
        String compact = value.replaceAll("\\s+", " ").strip();
        if (compact.isEmpty()) {
            return "Empty value";
        }
        return compact.length() <= length ? compact : compact.substring(0, length - 1) + "…";
    }

    private String humanize(String value) {
        String result = value.replace('-', ' ').replace('_', ' ').strip();
        return result.isEmpty() ? "General content" : Character.toUpperCase(result.charAt(0)) + result.substring(1);
    }

    private String leadingWhitespace(String value) {
        int index = 0;
        while (index < value.length() && Character.isWhitespace(value.charAt(index))) {
            index++;
        }
        return value.substring(0, index);
    }

    private String trailingWhitespace(String value) {
        int index = value.length();
        while (index > 0 && Character.isWhitespace(value.charAt(index - 1))) {
            index--;
        }
        return value.substring(index);
    }

    private Document parse(String html) {
        Document document = Jsoup.parse(html);
        document.outputSettings().prettyPrint(false);
        return document;
    }
}
