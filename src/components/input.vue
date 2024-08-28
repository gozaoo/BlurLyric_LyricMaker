<template>
    <div class="dynamic-input-container">
      <input
        type="text"

        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value);updateInputWidth()"
        ref="input"
        :style="{ width: inputWidth + 'px' }"
      />
    </div>
  </template>
  
  <script>
  export default {
    name: 'DynamicInput',
    data() {
      return {
        value: '', // 绑定到输入框的值
        inputWidth: 100, // 初始宽度，可根据需要调整
      };
    },
    methods: {
      updateInputWidth() {
        // 使用一个临时的span元素来获取文本宽度
        requestAnimationFrame(()=>{
        const tempSpan = document.createElement('span');
        tempSpan.style.position = 'absolute';
        tempSpan.style.visibility = 'hidden';
        tempSpan.style.whiteSpace = 'pre';
        tempSpan.style.font = window.getComputedStyle(this.$refs.input).font;
        tempSpan.textContent = this.modelValue;
  
        document.body.appendChild(tempSpan);
            const width = tempSpan.offsetWidth; // 加上一些额外的空间
            // console.log(tempSpan.offsetWidth);
            document.body.removeChild(tempSpan);
            // console.log(width);
            this.inputWidth = width;

        })
        
        // 更新输入框的宽度
      },
    },
  props: ['modelValue'],
  emits: ['update:modelValue'],
    mounted(){
        this.updateInputWidth()
    },
    watch:{
      modelValue:{
        handler(){
          this.updateInputWidth()
        }
      }
    }
};
  </script>
  
  <style scoped>
  .dynamic-input-container {
    display: inline-block;
    /* position: relative; */
  }
  input{
    padding: 7px;
    font-size: 15px;
    border-radius: 9px;
    border: none;
    background-color: #eee;
    color:#444;
    font-weight: 600;
    margin:2px 0;
    border: 1px solid #bbb;
    box-shadow: 0 0 3px #0001;
  }
  input:focus{
    outline: 2px solid #076cbc;
  }
  </style>
  