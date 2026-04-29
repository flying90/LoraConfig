<script>
	export default {
		onLaunch: function() {

		},
		onShow: function() {
			// let offset = new Date().getTimezoneOffset();
			// console.log('当前时区与UTC的时间差（单位：分钟）：', offset);
		},
		onHide: function() {
			
		}
	}
</script>

<style lang="scss">
	/*每个页面公共css */
	@import '@/uni_modules/uni-scss/index.scss';
	/* #ifndef APP-NVUE */
	@import '@/static/customicons.css';

	// 设置整个项目的背景色
	page {
		background-color: #15151B;
	}

	/* #endif */
	.example-info {
		font-size: 14px;
		color: #333;
		padding: 10px;
	}
</style>