package com.bss.dashboard.situation.support;

import com.bss.dashboard.exception.ResourceNotFoundException;
import com.bss.dashboard.situation.dto.SituationDataBundle;
import com.bss.dashboard.situation.dto.SituationPageDto;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class SituationDataLoader {

    private final ObjectMapper objectMapper;
    private SituationDataBundle cache;

    public SituationDataLoader(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public synchronized SituationDataBundle load() {
        if (cache != null) {
            return cache;
        }

        try {
            cache = objectMapper.readValue(
                    new ClassPathResource("mock/situations.json").getInputStream(),
                    SituationDataBundle.class
            );
            return cache;
        } catch (IOException e) {
            throw new IllegalStateException("无法加载态势页面数据文件 mock/situations.json", e);
        }
    }

    public SituationPageDto getPage(String pageCode) {
        return load().pages().stream()
                .filter(page -> page.code().equals(pageCode))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("未找到态势页面：" + pageCode));
    }
}
