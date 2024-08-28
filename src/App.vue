<script>
  // import HelloWorld from './components/HelloWorld.vue'
  import lyricParser from './javascript/lyricParser';
  import inputVue from './components/input.vue';
  import lyricVue from './components/lyric.vue';
  import baseUtils from './javascript/baseUtils';
  export default {
    components: {
      inputVue,
      lyricVue
    },
    data() {
      return {
        audioDom: new Audio(),
        lyricString: '',
        lyricObject: {
          "type": "exact",
          "headers": {
            "ar": "artist name",
            "ti": "song title",
            "al": "album Name",
            "ly": "Lyricist"
          },
          "lines": [{
              "startTime": 0,
              "duration": 2,
              "endTime": 2,
              "words": [{
                  "startTime": 0,
                  "duration": 1,
                  "endTime": 1,
                  "word": "Hello"
                },
                {
                  "startTime": 1.5,
                  "duration": 0.5,
                  "endTime": 2,
                  "word": "Hello"
                }
              ],
              "text": "HelloHello"
            },
            {
              "startTime": 1.5,
              "duration": 2,
              "endTime": 3.5,
              "words": [{
                  "startTime": 0,
                  "duration": 1,
                  "endTime": 1,
                  "word": "Second"
                },
                {
                  "startTime": 1.5,
                  "duration": 0.5,
                  "endTime": 2,
                  "word": "line"
                }
              ],
              "text": "Secondline"
            }
          ]
        },
        headerToName: {
          ar: '艺人名',
          ti: '音乐名',
          al: '专辑名',
          ly: '歌词作者',
        },
        audioUrl: '请输入内容',
        parsedData: {
          currentTime: '',
          duration: ''
        },
        pressTime: [],
        currentLineIndex: 0, // 当前歌词行索引
        currentWordIndex: -1, // 当前歌词词索引
      }
    },
    methods: {
      lyricParser,
      startListen() {

        window.addEventListener('keydown', (event) => {
          if (event.key === ' ') {
            event.preventDefault()
            this.handleSpacePress();
          } else if (event.key === '/') {
            event.preventDefault()

            this.handleSlashPress();
          }
        });
      },
      stopListen() {

        window.removeEventListener('keydown', this.handleSpacePress);
        window.removeEventListener('keydown', this.handleSlashPress);
      },
      playMusic() {
        this.audioDom.play();
      },
      updateStartTime() {
        // 准备下一个词的索引

        this.currentWordIndex++
        const currentTime = this.audioDom.currentTime;
        const currentLine = this.lyricObject.lines[this.currentLineIndex];
        if (this.currentWordIndex < currentLine.words.length) {

          const currentWord = currentLine.words[this.currentWordIndex];
          currentWord.startTime = baseUtils.toFixed_Number(currentTime, 3);

        }

        // 更新当前词的开始时间

        // 如果有上一个词，则更新上一个词的结束时间
        if (this.currentWordIndex > 0) {
          const previousWord = currentLine.words[this.currentWordIndex - 1];

          previousWord.endTime = baseUtils.toFixed_Number(currentTime, 3);
          previousWord.duration = baseUtils.toFixed_Number(previousWord.endTime - previousWord.startTime, 3)
        }

        if (this.currentWordIndex === currentLine.words.length) {
          currentLine.startTime = currentLine.words[0].startTime
          currentLine.endTime = currentLine.words[currentLine.words.length - 1].endTime
          currentLine.duration = currentLine.endTime - currentLine.startTime

          // 移动到下一行并重置词索引
          this.currentLineIndex++;
          this.currentWordIndex = -1;
        }
      },
      updateEndTime() {
        const currentTime = this.audioDom.currentTime;
        const currentLine = this.lyricObject.lines[this.currentLineIndex];
        const currentWord = currentLine.words[this.currentWordIndex - 1]; // 使用上一个词的索引

        // 更新当前词的结束时间
        currentWord.endTime = currentTime;

        // 如果当前行还有更多词，则更新下一个词的开始时间
        if (this.currentWordIndex < currentLine.words.length) {
          const nextWord = currentLine.words[this.currentWordIndex];
          nextWord.startTime = currentTime;
        }

        // 准备下一个词的索引
        this.currentWordIndex++;
      },
      handleSpacePress() {
        this.updateStartTime();
      },
      handleSlashPress() {
        this.updateEndTime();
      },
      ...baseUtils,
      importLocalAudio(event) {
        // 检查是否选择了文件
        if (event.target.files && event.target.files[0]) {
          // 创建一个新的FileReader来读取文件
          const reader = new FileReader();
          reader.onload = (e) => {
            // 当文件读取完成后，设置audio元素的src属性
            this.audioDom.src = e.target.result;
          };
          // 读取文件内容
          reader.readAsDataURL(event.target.files[0]);
        }
      },
      importAudioFromUrl() {
        // 检查音频链接是否为空
        if (this.audioUrl) {
          // 设置audio元素的src属性为提供的链接
          this.audioDom.src = this.audioUrl;
        }
      },
      导出() {
        baseUtils.copy(lyricParser.toBLFfile(this.lyricObject))
      },
      importLyric(type) {
        let content = this.lyricString
        switch (type) {
          case 'BLF':
            this.lyricObject = lyricParser.parseBLFlyric(content)
            break;

          case 'YRC':
            this.lyricObject = lyricParser.parseYRClyric(content)
            break;

          case 'LRC':
            this.lyricObject = lyricParser.parseLRClyric(content)
            break;

          default:
            break;
        }
      },
      addWord(event, lineIndex, wordIndex) {
        //keyCode对于老版本的浏览器
        //key是现代浏览器推荐的方式
        if (event.key === '\\' || event.keyCode === 220) {
          console.log(lineIndex, wordIndex);
          event.preventDefault()
          this.lyricObject.lines[lineIndex].words.splice(wordIndex + 1, 0, {
            "startTime": 0,
            "duration": 1,
            "endTime": 1,
            "word": ""
          })
        }
        if (event.keyCode === 46) {
          console.log(lineIndex, wordIndex);
          event.preventDefault()
          this.lyricObject.lines[lineIndex].words.splice(wordIndex, 1)
          console.log(this.lyricObject.lines[lineIndex].words);
          
          if (this.lyricObject.lines[lineIndex].words.length == 0) {
            this.lyricObject.lines.splice(lineIndex, 1)
          }
        }
      },
      addALine(event, lineIndex) {
        this.lyricObject.lines.splice(lineIndex + 1, 0, 
        {
              "startTime": 1.5,
              "duration": 2,
              "endTime": 3.5,
              "words": [{
                  "startTime": 0,
                  "duration": 1,
                  "endTime": 1,
                  "word": "new "
                },
                {
                  "startTime": 1.5,
                  "duration": 0.5,
                  "endTime": 2,
                  "word": "line"
                }
              ],
              "text": "new line"
            })
      }
    },
    mounted() {
      let audioTimeUpdater = () => {
        if (!this.audioDom.paused) {
          this.parsedData.currentTime = this.parseDuration(this.audioDom.currentTime)
          this.parsedData.duration = this.parseDuration(this.audioDom.duration)
        }
        requestAnimationFrame(() => audioTimeUpdater())
      }
      audioTimeUpdater()
    },
    watch: {
      currentWordIndex: {
        handler(newVal) {
          // console.log(newVal);

        }
      }
    }
  }
</script>

<template>
  <div class="main">
    <div class="lyricWriter">
      <div>导入音频</div>
      <div>

        <input type="file" @change="importLocalAudio" />

      </div>

      <button @click="importAudioFromUrl">从URL导入</button>
      <inputVue type="text" v-model="audioUrl" /> <br>
      <button @click="audioDom.play()">播放</button>
      <button @click="audioDom.pause()">暂停</button>
      <button @click="startListen()">开始录制</button>
      <button @click="stopListen()">停止录制</button>
      <!-- {{ this.parsedData.currentTime }}
      {{ this.parsedData.duration }} <br>
      -->
      <button @click="导出()">导出为BLF到粘贴板</button><br>
      <textarea v-model="lyricString"></textarea><br>
      <button @click="importLyric('YRC')">以YRC格式导入</button>
      <button @click="importLyric('BLF')">以BLF格式导入</button>
      <button @click="importLyric('LRC')">以LRC格式导入</button>
      <div class="lyricTable">
        header:
        <div class="header">
          <div v-for="(value,index) in lyricObject.headers" class="line">
            {{ headerToName[index] }}
            <inputVue type="text" v-model="lyricObject.headers[index]" />
          </div>
        </div>
        mainText:
        <div class="lines">
          <div v-for="(value1,index1) in lyricObject.lines" class="line">
            <button
              @click="this.audioDom.currentTime = value1.startTime-2;currentLineIndex = index1;currentWordIndex = -1">{{ index1 }}
            </button>


            <inputVue @keydown="(event)=>{addWord(event,index1,index2)}"
              :class="[(currentLineIndex==index1&&currentWordIndex==index2)?'active':'']"
              v-for="(value2,index2) in value1.words" type="text"
              v-model="lyricObject.lines[index1].words[index2].word" />
            <button @click="(event)=>{addALine(event,index1)}"> + </button>

          </div>
        </div>
      </div>
    </div>
    <div class="lyricPreviewBox">
      <lyricVue :audioDom="this.audioDom" :lyricObject="this.lyricObject" />
    </div>
  </div>
</template>

<style scoped>
  .main {
    display: flex;
    gap: 10px;
    height: 100vh;
    overflow: hidden;
  }

  .lines .line {
    display: flex;
    flex-wrap: wrap;
    gap: 2px;
    align-items: center;
  }

  button {
    padding: 7px;
    font-size: 15px;
    border-radius: 9px;
    border: 1px solid #bbb;
    box-shadow: 0 0 6px #0002;
    background-color: #eee;
    color: #222;
    margin: 2px;
    cursor: pointer;
  }

  .lyricWriter {
    padding: 20px;
    height: 100vh;
    box-sizing: border-box;

    position: relative;
  }

  .lyricPreviewBox {
    position: relative;
    height: 80vh;
    width: 40vw;
    min-width: 40vw;
    margin-left: auto;
    background: #eee;
    border: 1px solid #bbb;
    border-radius: 13px;
    margin: auto 0;
    overflow: hidden;
    box-shadow: 0 0 6px #0002;
    padding: 0 20px;
    box-sizing: border-box;

  }

  .lyricTable {
    height: 74%;
    overflow: auto
  }

  .active * {
    outline: 2px solid #076cbc;
    box-shadow: 0 0 6px #076cbc;

  }
</style>