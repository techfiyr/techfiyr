package com.techfiyr.cms;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CmsPageService {
    public static final List<PageDefinition> PAGE_DEFINITIONS = List.of(
            new PageDefinition("home", "Home", "/", "index.html"),
            new PageDefinition("about", "About", "/about", "about.html"),
            new PageDefinition("contact", "Contact", "/contact", "contact.html"),
            new PageDefinition("team", "Team Detail", "/team", "team-detail.html"),
            new PageDefinition("coming-soon", "Coming Soon", "/coming-soon", "coming-soon.html"),
            new PageDefinition("not-found", "Not Found", "/not-found", "not-found.html")
    );

    private final CmsPageRepository repository;
    private final CmsContentEditor editor;
    private final PageSourceService sourceService;

    public CmsPageService(CmsPageRepository repository, CmsContentEditor editor, PageSourceService sourceService) {
        this.repository = repository;
        this.editor = editor;
        this.sourceService = sourceService;
    }

    @Transactional
    public void initializeMissingPages() {
        for (PageDefinition definition : PAGE_DEFINITIONS) {
            CmsPage existing = repository.findBySlug(definition.slug()).orElse(null);
            if (existing != null) {
                String upgradedHtml = sourceService.upgradeStoredContent(existing.getHtmlContent(), definition.slug());
                String synchronizedHtml = editor.synchronizeEditableMarkers(upgradedHtml);
                if (!synchronizedHtml.equals(existing.getHtmlContent())) {
                    existing.setHtmlContent(synchronizedHtml);
                    existing.setUpdatedBy("system");
                }
                continue;
            }
            CmsPage page = new CmsPage();
            page.setSlug(definition.slug());
            page.setDisplayName(definition.displayName());
            page.setRoute(definition.route());
            page.setSourceFile(definition.sourceFile());
            page.setHtmlContent(sourceService.loadPrepared(definition));
            page.setPublished(true);
            page.setUpdatedBy("system");
            repository.save(page);
        }
    }

    @Transactional(readOnly = true)
    public List<CmsPage> findAll() {
        return repository.findAllByOrderByDisplayNameAsc();
    }

    @Transactional(readOnly = true)
    public CmsPage requireBySlug(String slug) {
        return repository.findBySlug(slug)
                .orElseThrow(() -> new EntityNotFoundException("Page not found: " + slug));
    }

    @Transactional(readOnly = true)
    public CmsPage requirePublished(String slug) {
        return repository.findBySlugAndPublishedTrue(slug)
                .orElseThrow(() -> new EntityNotFoundException("Published page not found: " + slug));
    }

    @Transactional
    public List<EditableField> fieldsFor(String slug) {
        CmsPage page = requireBySlug(slug);
        String upgradedHtml = sourceService.upgradeStoredContent(page.getHtmlContent(), slug);
        String synchronizedHtml = editor.synchronizeEditableMarkers(upgradedHtml);
        if (!synchronizedHtml.equals(page.getHtmlContent())) {
            page.setHtmlContent(synchronizedHtml);
            page.setUpdatedBy("system");
        }
        return editor.extractFields(synchronizedHtml);
    }

    @Transactional
    public void update(String slug, PageUpdateForm form, String username) {
        CmsPage page = requireBySlug(slug);
        page.setHtmlContent(editor.applyUpdates(page.getHtmlContent(), form.getKeys(), form.getValues()));
        page.setPublished(form.isPublished());
        page.setUpdatedBy(username);
    }

    @Transactional
    public void reset(String slug, String username) {
        CmsPage page = requireBySlug(slug);
        PageDefinition definition = PAGE_DEFINITIONS.stream()
                .filter(candidate -> candidate.slug().equals(slug))
                .findFirst()
                .orElseThrow(() -> new EntityNotFoundException("Source page not found: " + slug));
        page.setHtmlContent(sourceService.loadPrepared(definition));
        page.setUpdatedBy(username);
    }
}
