# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e2]:
    - generic [ref=e3]:
      - generic [ref=e6]: Bước 1/5
      - generic [ref=e13]:
        - heading "Chọn video từ máy" [level=1] [ref=e14]
        - generic [ref=e15]:
          - generic [ref=e16] [cursor=pointer]:
            - button "Choose File" [ref=e17]
            - img [ref=e19]
            - heading "Kéo thả video vào đây hoặc nhấn để chọn" [level=2] [ref=e21]
            - paragraph [ref=e22]: Tối đa 600MB mỗi video
            - paragraph [ref=e23]: Tối đa 10 phút mỗi video
            - paragraph [ref=e24]: Hỗ trợ file .MOV và .MP4
            - button "Chọn video" [ref=e26]:
              - generic [ref=e27]: Chọn video
          - generic [ref=e30]:
            - img [ref=e32]
            - generic [ref=e34]:
              - heading "Lỗi" [level=3] [ref=e35]
              - paragraph [ref=e36]: Định dạng không hợp lệ
              - button "Thử lại" [ref=e38] [cursor=pointer]
  - button "Open Next.js Dev Tools" [ref=e44] [cursor=pointer]:
    - img [ref=e45]
  - alert [ref=e48]
```