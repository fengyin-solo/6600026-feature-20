<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useSequenceStore } from './store/sequence';
import AlignmentView from './components/AlignmentView.vue';
import PhyloTree from './components/PhyloTree.vue';
import GCChart from './components/GCChart.vue';

const store = useSequenceStore();
const gcSeqId = ref('');
const gcWindowSize = ref(50);
const newSeqName = ref('');
const newSeqData = ref('');
const isBuildingTree = ref(false);

onMounted(() => {
  store.loadMockSequences();
  if (store.sequences.length > 0) {
    gcSeqId.value = store.sequences[0].id;
  }
});

function handleRunAlignment() {
  if (!store.selectedSeq1 || !store.selectedSeq2) return;
  if (store.selectedSeq1 === store.selectedSeq2) {
    alert('请选择两个不同的序列');
    return;
  }
  store.runAlignment(store.selectedSeq1, store.selectedSeq2, store.currentAlgorithm);
}

function handleAnalyzeGC() {
  if (!gcSeqId.value) return;
  store.analyzeGC(gcSeqId.value, gcWindowSize.value);
}

function handleBuildTree() {
  if (store.sequences.length < 2) {
    alert('至少需要2条序列');
    return;
  }
  isBuildingTree.value = true;
  setTimeout(() => {
    store.buildTree();
    isBuildingTree.value = false;
  }, 100);
}

function handleAddSequence() {
  if (!newSeqName.value.trim() || !newSeqData.value.trim()) return;
  const id = 'custom-' + Date.now();
  store.addSequence(id, newSeqName.value.trim(), newSeqData.value.trim());
  newSeqName.value = '';
  newSeqData.value = '';
}

function handleLoadMock() {
  store.loadMockSequences();
  gcSeqId.value = store.sequences[0]?.id || '';
}
</script>

<template>
  <div class="min-h-screen bg-gray-900 text-gray-100">
    <!-- Header -->
    <header class="px-6 py-3 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        </div>
        <h1 class="text-lg font-bold">基因序列比对与进化树可视化</h1>
      </div>
      <div class="flex items-center gap-2">
        <button
          @click="handleLoadMock"
          class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded transition-colors"
        >
          加载示例序列
        </button>
      </div>
    </header>

    <div class="p-4 space-y-4">
      <!-- Sequence List Panel -->
      <section class="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div class="px-4 py-2 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
          <h2 class="text-sm font-semibold text-gray-300">序列列表</h2>
          <span class="text-xs text-gray-500">{{ store.sequences.length }} 条序列</span>
        </div>

        <!-- Add sequence form -->
        <div class="px-4 py-2 bg-gray-850 border-b border-gray-700 flex items-center gap-2" style="background-color: #1a2234;">
          <input
            v-model="newSeqName"
            type="text"
            placeholder="序列名称"
            class="px-3 py-1.5 bg-gray-900 border border-gray-600 rounded text-gray-100 text-sm placeholder-gray-500 focus:outline-none focus:border-emerald-500 w-48"
          />
          <input
            v-model="newSeqData"
            type="text"
            placeholder="序列数据 (ACGT...)"
            class="flex-1 px-3 py-1.5 bg-gray-900 border border-gray-600 rounded text-gray-100 text-sm placeholder-gray-500 focus:outline-none focus:border-emerald-500 font-mono"
          />
          <button
            @click="handleAddSequence"
            class="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm rounded transition-colors border border-gray-600"
          >
            添加
          </button>
        </div>

        <!-- Sequence table -->
        <div class="max-h-48 overflow-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-800 sticky top-0">
              <tr class="text-gray-400 text-left">
                <th class="px-4 py-1.5 font-medium">ID</th>
                <th class="px-4 py-1.5 font-medium">名称</th>
                <th class="px-4 py-1.5 font-medium w-20">长度</th>
                <th class="px-4 py-1.5 font-medium w-16">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="seq in store.sequences" :key="seq.id" class="border-t border-gray-700 hover:bg-gray-800/50">
                <td class="px-4 py-1.5 text-cyan-400 font-mono text-xs">{{ seq.id }}</td>
                <td class="px-4 py-1.5 text-gray-200">{{ seq.name }}</td>
                <td class="px-4 py-1.5 text-gray-400">{{ seq.data.length }} bp</td>
                <td class="px-4 py-1.5">
                  <button
                    @click="store.removeSequence(seq.id)"
                    class="text-red-400 hover:text-red-300 text-xs"
                  >
                    删除
                  </button>
                </td>
              </tr>
              <tr v-if="store.sequences.length === 0">
                <td colspan="4" class="px-4 py-6 text-center text-gray-500 text-sm">
                  暂无序列 — 点击"加载示例序列"添加
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Middle Row: Alignment + GC Content -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- Alignment Section -->
        <section class="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div class="px-4 py-2 bg-gray-800 border-b border-gray-700">
            <h2 class="text-sm font-semibold text-gray-300">序列比对</h2>
          </div>
          <div class="p-4 space-y-3">
            <!-- Controls -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs text-gray-400 mb-1">序列 1</label>
                <select
                  v-model="store.selectedSeq1"
                  class="w-full px-3 py-1.5 bg-gray-900 border border-gray-600 rounded text-gray-100 text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="" disabled>选择序列</option>
                  <option v-for="seq in store.sequences" :key="seq.id" :value="seq.id">
                    {{ seq.name }}
                  </option>
                </select>
              </div>
              <div>
                <label class="block text-xs text-gray-400 mb-1">序列 2</label>
                <select
                  v-model="store.selectedSeq2"
                  class="w-full px-3 py-1.5 bg-gray-900 border border-gray-600 rounded text-gray-100 text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="" disabled>选择序列</option>
                  <option v-for="seq in store.sequences" :key="seq.id" :value="seq.id">
                    {{ seq.name }}
                  </option>
                </select>
              </div>
            </div>

            <div class="flex items-center gap-4">
              <label class="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" v-model="store.currentAlgorithm" value="nw" class="accent-emerald-500" />
                <span class="text-gray-300">Needleman-Wunsch (全局)</span>
              </label>
              <label class="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" v-model="store.currentAlgorithm" value="sw" class="accent-emerald-500" />
                <span class="text-gray-300">Smith-Waterman (局部)</span>
              </label>
              <button
                @click="handleRunAlignment"
                class="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded transition-colors ml-auto"
              >
                运行比对
              </button>
            </div>

            <!-- Alignment Result -->
            <AlignmentView :result="store.alignmentResult" />
          </div>
        </section>

        <!-- GC Content Section -->
        <section class="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div class="px-4 py-2 bg-gray-800 border-b border-gray-700">
            <h2 class="text-sm font-semibold text-gray-300">GC含量分析</h2>
          </div>
          <div class="p-4 space-y-3">
            <div class="flex items-center gap-3">
              <div class="flex-1">
                <label class="block text-xs text-gray-400 mb-1">选择序列</label>
                <select
                  v-model="gcSeqId"
                  class="w-full px-3 py-1.5 bg-gray-900 border border-gray-600 rounded text-gray-100 text-sm focus:outline-none focus:border-emerald-500"
                >
                  <option value="" disabled>选择序列</option>
                  <option v-for="seq in store.sequences" :key="seq.id" :value="seq.id">
                    {{ seq.name }}
                  </option>
                </select>
              </div>
              <div class="flex-1">
                <label class="block text-xs text-gray-400 mb-1">
                  窗口大小: <span class="text-cyan-400">{{ gcWindowSize }}</span> bp
                </label>
                <input
                  v-model.number="gcWindowSize"
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  class="w-full accent-emerald-500"
                />
              </div>
              <button
                @click="handleAnalyzeGC"
                class="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded transition-colors self-end"
              >
                分析
              </button>
            </div>

            <!-- GC Chart -->
            <GCChart :data="store.gcData" />
          </div>
        </section>
      </div>

      <!-- Phylogenetic Tree Section -->
      <section class="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div class="px-4 py-2 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
          <h2 class="text-sm font-semibold text-gray-300">系统发育树</h2>
          <button
            @click="handleBuildTree"
            :disabled="isBuildingTree || store.sequences.length < 2"
            class="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isBuildingTree ? '构建中...' : '构建进化树' }}
          </button>
        </div>
        <div class="p-4">
          <PhyloTree :tree="store.phyloTree" />
        </div>
      </section>
    </div>
  </div>
</template>
