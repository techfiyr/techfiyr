package com.techfiyr.cms;

public record EditableField(
        String key,
        String label,
        String value,
        FieldType type,
        String section
) {
}
