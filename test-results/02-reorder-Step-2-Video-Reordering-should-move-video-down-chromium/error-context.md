# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e2]:
    - generic [ref=e3]:
      - generic [ref=e6]: Bước 1/5
      - generic [ref=e13]:
        - heading "Chọn video từ máy" [level=1] [ref=e14]
        - generic [ref=e15]:
          - button "Choose File" [ref=e16]
          - img [ref=e18] [cursor=pointer]
          - heading "Đang xử lý..." [level=2] [ref=e20] [cursor=pointer]
          - paragraph [ref=e21] [cursor=pointer]: Vui lòng đợi...
          - generic [ref=e22]:
            - generic [ref=e23]:
              - heading "Đã chọn 1 video" [level=3] [ref=e24]
              - paragraph [ref=e25]: Có thể chọn thêm 4 video
            - generic [ref=e28]:
              - generic [ref=e30]: "1."
              - generic [ref=e31]:
                - img "test-video-3s.mp4" [ref=e32]
                - generic [ref=e33]: 0:03
              - generic [ref=e34]:
                - heading "test-video-3s.mp4" [level=3] [ref=e35]
                - paragraph [ref=e36]: 0.1 MB
                - button "Xóa video" [ref=e38] [cursor=pointer]:
                  - img [ref=e39]
                  - text: Xóa
        - button "Tiếp tục" [disabled] [ref=e42]
  - button "Open Next.js Dev Tools" [ref=e48] [cursor=pointer]:
    - img [ref=e49]
  - alert [ref=e52]
```