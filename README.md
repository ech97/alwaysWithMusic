# alwaysWithMusic
> Recommand and Play the Music when you come home from work
> ```sh
> When you press the button when you wake up or leave work (recognize through door sensor in the late evening), recommend a song that fits the mood at that time and play it
> ```
## ToDo
- we add volume slide (node-mpv have properties (control sound while play music)
- pade-out
- volume
- url만 받아서 틀어주는 기능도 만들면 좋을듯
- 온도계로부터 데이터만 받아주면 됨
- 커맨드로 노래 끝나면 꺼버리기
## Need to fix
- only we can play music when connect with ssh -X || when execute mpv with DISPLAY=:0 mpv [audio.mp3]
## How it works
### 1. Event Listen from Smart Things Cloud
// 온도, 습도 가져오고, 버튼 누르거나 도어센서 인식했을때 실행도ㅁ게 할거임
### 2. Ask ChatGPT for music title that suits the mood
### 3. Send a music title to Embedded board
### 4. Play a music
esp8266에 넣어주는것도 방법
