package com.techfiyr.cms;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CmsPageRepository extends JpaRepository<CmsPage, Long> {
    Optional<CmsPage> findBySlug(String slug);
    Optional<CmsPage> findBySlugAndPublishedTrue(String slug);
    List<CmsPage> findAllByOrderByDisplayNameAsc();
}
