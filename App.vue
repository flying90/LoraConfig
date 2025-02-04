<script>
	export default {
		onLaunch: function() {

		},
		onShow: function() {
			// let main = plus.android.runtimeMainActivity();
			// let Launcher = plus.android.importClass("androidx.activity.result.ActivityResultLauncher");

			// console.log(Launcher);
			// console.log('=========++====++=+++===')
			// console.log(main.getIntent());
			// console.log((main.getIntent()).getData());
			// console.log(plus.runtime.arguments)
		},
		onHide: function() {
			console.log('App Hide')
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
		background-color: #f5f5f5;
	}

	/* #endif */
	.example-info {
		font-size: 14px;
		color: #333;
		padding: 10px;
	}
</style>