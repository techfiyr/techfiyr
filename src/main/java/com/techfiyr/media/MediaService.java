package com.techfiyr.media;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.*;

@Service
public class MediaService {
    private static final Map<String, String> ALLOWED_TYPES = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp",
            "image/gif", ".gif"
    );

    private final MediaAssetRepository repository;
    private final Path uploadDirectory;

    public MediaService(MediaAssetRepository repository, @Value("${app.upload-dir}") String uploadDirectory) {
        this.repository = repository;
        this.uploadDirectory = Path.of(uploadDirectory).toAbsolutePath().normalize();
    }

    @Transactional(readOnly = true)
    public List<MediaAsset> findAll() {
        return repository.findAllByOrderByUploadedAtDesc();
    }

    @Transactional
    public MediaAsset upload(MultipartFile file, String username) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Choose an image to upload.");
        }
        String contentType = Optional.ofNullable(file.getContentType()).orElse("").toLowerCase(Locale.ROOT);
        String extension = ALLOWED_TYPES.get(contentType);
        if (extension == null) {
            throw new IllegalArgumentException("Only JPG, PNG, WebP, and GIF images are allowed.");
        }
        String storedName = UUID.randomUUID() + extension;
        try {
            Files.createDirectories(uploadDirectory);
            Path destination = uploadDirectory.resolve(storedName).normalize();
            if (!destination.startsWith(uploadDirectory)) {
                throw new IllegalArgumentException("Invalid upload path.");
            }
            Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException exception) {
            throw new IllegalStateException("The image could not be stored.", exception);
        }

        MediaAsset asset = new MediaAsset();
        asset.setOriginalName(safeOriginalName(file.getOriginalFilename()));
        asset.setStoredName(storedName);
        asset.setContentType(contentType);
        asset.setSizeBytes(file.getSize());
        asset.setPublicPath("/uploads/" + storedName);
        asset.setUploadedBy(username);
        return repository.save(asset);
    }

    private String safeOriginalName(String value) {
        if (value == null || value.isBlank()) return "image";
        String name = Path.of(value).getFileName().toString().replaceAll("[\\r\\n]", "");
        return name.length() <= 255 ? name : name.substring(name.length() - 255);
    }
}
