import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Sequence, AlignmentResult, GCContent, PhyloNode, TreeBuildProgress } from '../types';
import {
  needlemanWunsch,
  smithWaterman,
  calculateGCContent,
  calculateDistanceMatrix,
  buildNJTree,
  MOCK_SEQUENCES
} from '../utils/alignment';

export const useSequenceStore = defineStore('sequence', () => {
  const sequences = ref<Sequence[]>([]);
  const alignmentResult = ref<AlignmentResult | null>(null);
  const currentAlgorithm = ref<'nw' | 'sw'>('nw');
  const gcData = ref<GCContent[]>([]);
  const phyloTree = ref<PhyloNode | null>(null);
  const selectedSeq1 = ref<string>('');
  const selectedSeq2 = ref<string>('');
  const treeBuildProgress = ref<TreeBuildProgress>({
    status: 'idle',
    progress: 0,
    message: '',
    error: null
  });

  const alignmentIdentity = computed(() => {
    return alignmentResult.value ? alignmentResult.value.identity : 0;
  });

  const alignmentScore = computed(() => {
    return alignmentResult.value ? alignmentResult.value.score : 0;
  });

  function addSequence(id: string, name: string, data: string) {
    sequences.value.push({
      id,
      name,
      data: data.toUpperCase().replace(/[^ACGT]/g, ''),
      length: data.length
    });
  }

  function removeSequence(id: string) {
    sequences.value = sequences.value.filter(s => s.id !== id);
  }

  function runAlignment(seq1Id: string, seq2Id: string, algorithm: 'nw' | 'sw') {
    const s1 = sequences.value.find(s => s.id === seq1Id);
    const s2 = sequences.value.find(s => s.id === seq2Id);

    if (!s1 || !s2) return;

    currentAlgorithm.value = algorithm;

    if (algorithm === 'nw') {
      alignmentResult.value = needlemanWunsch(s1.data, s2.data);
    } else {
      alignmentResult.value = smithWaterman(s1.data, s2.data);
    }
  }

  function loadMockSequences() {
    sequences.value = [];
    for (const mock of MOCK_SEQUENCES) {
      addSequence(mock.id, mock.name, mock.data);
    }
    selectedSeq1.value = MOCK_SEQUENCES[0].id;
    selectedSeq2.value = MOCK_SEQUENCES[1].id;
  }

  async function buildTree() {
    if (sequences.value.length < 2) {
      treeBuildProgress.value = {
        status: 'error',
        progress: 0,
        message: '',
        error: '至少需要2条序列才能构建进化树'
      };
      return;
    }

    if (treeBuildProgress.value.status === 'calculating' || treeBuildProgress.value.status === 'building') {
      return;
    }

    treeBuildProgress.value = {
      status: 'calculating',
      progress: 0,
      message: '正在计算距离矩阵...',
      error: null
    };

    try {
      await new Promise(resolve => setTimeout(resolve, 20));

      const seqData = sequences.value.map(s => ({ name: s.name, data: s.data }));

      const distMatrix = calculateDistanceMatrix(seqData, (current, total) => {
        const progress = Math.round((current / total) * 60);
        treeBuildProgress.value = {
          status: 'calculating',
          progress,
          message: `正在计算距离矩阵... (${current}/${total})`,
          error: null
        };
      });

      treeBuildProgress.value = {
        status: 'building',
        progress: 60,
        message: '正在构建进化树...',
        error: null
      };

      await new Promise(resolve => setTimeout(resolve, 20));

      const names = sequences.value.map(s => s.name);
      const totalSteps = Math.max(names.length - 2, 1);

      phyloTree.value = buildNJTree(distMatrix, names, (current, total) => {
        const progress = 60 + Math.round((current / total) * 40);
        treeBuildProgress.value = {
          status: 'building',
          progress,
          message: `正在构建进化树... (${current}/${total})`,
          error: null
        };
      });

      treeBuildProgress.value = {
        status: 'success',
        progress: 100,
        message: '进化树构建完成',
        error: null
      };
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : '未知错误';
      treeBuildProgress.value = {
        status: 'error',
        progress: 0,
        message: '',
        error: `构建进化树失败: ${errorMsg}`
      };
      phyloTree.value = null;
    }
  }

  function resetTreeBuild() {
    treeBuildProgress.value = {
      status: 'idle',
      progress: 0,
      message: '',
      error: null
    };
  }

  function analyzeGC(seqId: string, windowSize: number) {
    const seq = sequences.value.find(s => s.id === seqId);
    if (!seq) return;
    gcData.value = calculateGCContent(seq.data, windowSize);
  }

  return {
    sequences,
    alignmentResult,
    currentAlgorithm,
    gcData,
    phyloTree,
    selectedSeq1,
    selectedSeq2,
    treeBuildProgress,
    alignmentIdentity,
    alignmentScore,
    addSequence,
    removeSequence,
    runAlignment,
    loadMockSequences,
    buildTree,
    resetTreeBuild,
    analyzeGC
  };
});
