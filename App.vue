<script>
	export default {
		onLaunch: function() {
			console.log('App Launch')
		},
		onShow: function() {
			console.log('App Show')
			const sysSetting = uni.getSystemSetting();
			if (sysSetting.bluetoothEnabled) {
				uni.openBluetoothAdapter({
					success: e => {
						console.log("蓝牙初始化成功");
					},
					fail: (e) => {
						console.log("蓝牙初始化失败，错误码：" + (e.errCode || e.errMsg));
					}
				})
			}
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
