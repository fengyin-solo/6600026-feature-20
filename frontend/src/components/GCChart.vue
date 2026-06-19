<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue';
import type { GCContent } from '../types';

const props = defineProps<{
  data: GCContent[];
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);

function drawChart() {
  const canvas = canvasRef.value;
  if (!canvas || !props.data || props.data.length === 0) return;

  const width = 600;
  const height = 200;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background
  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 0, width, height);

  const leftMargin = 50;
  const rightMargin = 20;
  const topMargin = 25;
  const bottomMargin = 35;
  const plotWidth = width - leftMargin - rightMargin;
  const plotHeight = height - topMargin - bottomMargin;

  // Grid lines
  ctx.strokeStyle = '#1f2937';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = topMargin + (plotHeight / 4) * i;
    ctx.beginPath();
    ctx.moveTo(leftMargin, y);
    ctx.lineTo(width - rightMargin, y);
    ctx.stroke();
  }

  // Y-axis labels (0%, 25%, 50%, 75%, 100%)
  ctx.fillStyle = '#6b7280';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'right';
  for (let i = 0; i <= 4; i++) {
    const y = topMargin + (plotHeight / 4) * i;
    const label = (100 - i * 25) + '%';
    ctx.fillText(label, leftMargin - 8, y + 3);
  }

  // X-axis
  const positions = props.data.map(d => d.position);
  const minPos = Math.min(...positions);
  const maxPos = Math.max(...positions);
  const posRange = maxPos - minPos || 1;

  ctx.fillStyle = '#6b7280';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';

  // X-axis tick labels
  for (let i = 0; i <= 5; i++) {
    const pos = Math.round(minPos + (posRange / 5) * i);
    const x = leftMargin + (plotWidth / 5) * i;
    ctx.fillText(String(pos), x, height - bottomMargin + 15);
  }

  // Axis labels
  ctx.fillStyle = '#9ca3af';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('位置 (bp)', width / 2, height - 5);

  ctx.save();
  ctx.translate(12, height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('GC%', 0, 0);
  ctx.restore();

  // Draw filled area
  ctx.beginPath();
  ctx.moveTo(leftMargin, topMargin + plotHeight);

  for (let i = 0; i < props.data.length; i++) {
    const d = props.data[i];
    const x = leftMargin + ((d.position - minPos) / posRange) * plotWidth;
    const y = topMargin + plotHeight - (d.gc / 100) * plotHeight;
    if (i === 0) ctx.lineTo(x, y);
    else ctx.lineTo(x, y);
  }

  const lastD = props.data[props.data.length - 1];
  const lastX = leftMargin + ((lastD.position - minPos) / posRange) * plotWidth;
  ctx.lineTo(lastX, topMargin + plotHeight);
  ctx.closePath();

  // Gradient fill
  const gradient = ctx.createLinearGradient(0, topMargin, 0, topMargin + plotHeight);
  gradient.addColorStop(0, 'rgba(6, 182, 212, 0.3)');
  gradient.addColorStop(1, 'rgba(6, 182, 212, 0.02)');
  ctx.fillStyle = gradient;
  ctx.fill();

  // Draw line
  ctx.beginPath();
  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 2;
  for (let i = 0; i < props.data.length; i++) {
    const d = props.data[i];
    const x = leftMargin + ((d.position - minPos) / posRange) * plotWidth;
    const y = topMargin + plotHeight - (d.gc / 100) * plotHeight;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Draw axes
  ctx.strokeStyle = '#374151';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(leftMargin, topMargin);
  ctx.lineTo(leftMargin, topMargin + plotHeight);
  ctx.lineTo(width - rightMargin, topMargin + plotHeight);
  ctx.stroke();

  // Title
  ctx.fillStyle = '#9ca3af';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('GC含量分布 (滑动窗口)', width / 2, 15);
}

onMounted(() => {
  drawChart();
});

watch(() => props.data, () => {
  nextTick(() => drawChart());
}, { deep: true });
</script>

<template>
  <div class="bg-gray-900 rounded-lg overflow-hidden">
    <div class="px-4 py-2 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
      <h3 class="text-sm font-semibold text-gray-300">GC含量分析</h3>
      <span v-if="data.length > 0" class="text-xs text-gray-500">
        {{ data.length }} 个数据点
      </span>
    </div>
    <div class="p-4 flex justify-center">
      <canvas
        v-if="data.length > 0"
        ref="canvasRef"
        width="600"
        height="200"
        class="border border-gray-700 rounded"
      ></canvas>
      <div v-else class="flex items-center justify-center w-full h-48 text-gray-600 text-sm">
        请选择序列并分析GC含量
      </div>
    </div>
  </div>
</template>
