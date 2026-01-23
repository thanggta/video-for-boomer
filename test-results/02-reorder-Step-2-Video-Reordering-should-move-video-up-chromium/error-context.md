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
          - generic [ref=e28]:
            - generic [ref=e29]:
              - heading "Đã chọn 1 video" [level=3] [ref=e30]
              - paragraph [ref=e31]: Có thể chọn thêm 4 video
            - generic [ref=e34]:
              - generic [ref=e36]: "1."
              - generic [ref=e37]:
                - img "test-video-3s.mp4" [ref=e38]
                - generic [ref=e39]: 0:03
              - generic [ref=e40]:
                - heading "test-video-3s.mp4" [level=3] [ref=e41]
                - paragraph [ref=e42]: 0.1 MB
                - button "Xóa video" [ref=e44] [cursor=pointer]:
                  - img [ref=e45]
                  - text: Xóa
        - button "Tiếp tục" [ref=e48] [cursor=pointer]
  - button "Open Next.js Dev Tools" [ref=e54] [cursor=pointer]:
    - img [ref=e55]
  - alert [ref=e58]
```