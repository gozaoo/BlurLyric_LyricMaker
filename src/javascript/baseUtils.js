export default {
    toFixed_Number(number, minFractionDigits) {
      // 方法：将数字格式化为指定小数位数
      return Number(number.toFixed(minFractionDigits));
    },
    toDurationArray(number, minFractionDigits) {
      // 方法：将数字转换为时长数组 [小时, 分钟, 秒]
      const fixedNumber = this.toFixed_Number(number, minFractionDigits);
      const hours = Math.floor(fixedNumber / 3600);
      const minutes = Math.floor((fixedNumber % 3600) / 60);
      const seconds = fixedNumber % 60;
      const millionSeconds = fixedNumber * 1000 % 1000;
      return [hours, minutes, seconds];
    },
    parseDuration(number) {
      // 方法：将数字解析为格式化的时长字符串
      const [hour, minute, second] = this.toDurationArray(number, 3);
      const pad = (num) => (num < 10 ? '0' + num : num); // 辅助函数，用于补齐数字
      return `${hour != 0 ? pad(hour) + ':' : ''}${pad(minute)}:${pad(this.toFixed_Number(second,3))}`;
    },
    copy(text) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    },
   pause(text) {
      const hiddenTextarea = document.createElement('textarea');
      hiddenTextarea.style.position = 'absolute';
      hiddenTextarea.style.left = '-9999px';
      document.body.appendChild(hiddenTextarea);

      try {
        // 确保textarea是空的
        hiddenTextarea.value = '';
    
        // 聚焦textarea
        hiddenTextarea.focus();
    
        // 使用document.execCommand('paste')方法粘贴内容
        document.execCommand('paste');
        let pastedText
        requestAnimationFrame(()=>{

        // 获取粘贴的内容
        pastedText = hiddenTextarea.value;
    
        // 处理获取到的剪切板内容
        console.log('剪切板内容:', pastedText);
        })

        return pastedText
    
      } catch (error) {
        // 处理错误情况
        console.error('无法读取剪切板:', error);
      }
    }
  };
  