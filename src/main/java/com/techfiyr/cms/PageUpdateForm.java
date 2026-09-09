package com.techfiyr.cms;

import java.util.ArrayList;
import java.util.List;

public class PageUpdateForm {
    private List<String> keys = new ArrayList<>();
    private List<String> values = new ArrayList<>();
    private boolean published;

    public List<String> getKeys() { return keys; }
    public void setKeys(List<String> keys) { this.keys = keys; }
    public List<String> getValues() { return values; }
    public void setValues(List<String> values) { this.values = values; }
    public boolean isPublished() { return published; }
    public void setPublished(boolean published) { this.published = published; }
}
