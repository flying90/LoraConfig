<template>
	<view class="container">
		<text style="font-size: 20px;">Capacity Usage:</text>
		<progress active="true" :percent="percent" show-info border-radius="3" stroke-width="20" />
		<view class="" style="margin-top: 5px;">
			<text style="color: black; font-size: 18px;">{{current}}</text>
			<text style="font-size: 18px;"> / </text>
			<text style="color: gray; font-size: 18px;">{{total}}</text>
		</view>
		<view class="" style="margin-top: 20px;">
			<text style="font-size: 20px;">Download Path:      </text>
			<button type="primary" style="display: inline;">Select</button>
			<input type="text" value="/path/to/download" style="height: 30px; border: 1px solid grey; background: lightgray; " disabled />
		</view>
		<view class="dw_btn">
			<button type="primary" :disabled="btnDisabled">Download</button>
		</view>		
	</view>
</template>

<script>
	import bleInfo from "@/common/common.js"
	export default {
		data() {
			return {
				total: 1997,
				current: 910,
			}
		},
		computed: {
			percent() {
				return (this.current / this.total * 100).toFixed(0)
			},
			btnDisabled(){
				return !bleInfo.ble_connected;
			}
		},
		methods: {

		}
	}

</script>

<style>
	.container {
		margin: 10px;
		font-size: 14px;
		line-height: 24px;
	}

	.dw_btn {
		position: fixed;
		bottom: 0;
		left: 0;
		width: 100%;
	}
</style>