<template>
  <div class="venue-map-container">
    <h1>会場マップ</h1>

    <!-- 会場切り替えボタン -->
    <div class="venue-buttons">
      <button
        v-for="(venue, index) in venues"
        :key="index"
        @click="setVenue(index)"
      >
        {{ venue.name }}
      </button>
    </div>

    <!-- 日付切り替え -->
    <div class="day-selector">
      <button
        @click="selectedDay = '1日目'"
        :class="{ active: selectedDay === '1日目' }"
      >
        1日目
      </button>
      <button
        @click="selectedDay = '2日目'"
        :class="{ active: selectedDay === '2日目' }"
      >
        2日目
      </button>
    </div>


    <div class="map-and-info">
      <!-- ズーム・パン対応マップ -->
      <div
        class="map-wrapper"
        ref="mapWrapper"
        @mousedown="startDrag"
        @mousemove="onDrag"
        @mouseup="endDrag"
        @mouseleave="endDrag"
        @touchstart="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
      >
        <div
          class="map-inner"
          :style="{
            transform: `scale(${scale})`,
            transformOrigin: 'top left'
          }"
        >
          <img
            :src="currentImage"
            alt="会場マップ"
            class="venue-map-image"
            ref="mapImage"
          />
          <div
            v-for="marker in visibleCircles"
            :key="marker.id"
            class="marker"
            :class="[getPriorityClass(marker), { completed: marker.completed, highlighted: marker.highlighted }]"
            :style="{
            top: marker.coords.y + 'px',
            left: marker.coords.x + 'px',
            width: marker.coords.width + 'px',
            height: marker.coords.height + 'px'
            }"
          />          
        </div>
      </div>
      <div class="circle-info-list">
        <h2>サークル一覧</h2>
        <ul>
          <li v-for="marker in visibleCircles" :key="marker.id">
            <button @click="focusOnMarker(marker)" class="map-button">場所</button>
            <strong>{{ marker.place }}</strong>:
            <router-link :to="{ name: 'CircleDetail', params: { id: marker.id.split('_')[0] } }">
              {{ marker.name }}
            </router-link>
            <span v-if="marker.completed" class="completed-label">✅</span>
          </li>
        </ul>
      </div>
    </div>

    <!-- ズーム操作 -->
    <div class="zoom-controls">
      <button @click="zoomOut">ズームアウト</button>
      <button @click="zoomIn">ズームイン</button>
      <button @click="resetZoom">リセット</button>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import placeMap from '@/assets/placeMap.json';

const baseURL = process.env.VUE_APP_API_BASE_URL

export default {
  name: 'VenueMap',
  data() {
    return {
      scale: 0.7,
      initialPinchDistance: null,
      isPinching: false,
      currentVenue: 0,
      circles: [],
      selectedDay: '1日目',
      dragging: false,
      dragStart: { x: 0, y: 0, scrollLeft: 0, scrollTop: 0 },
      venues: [
        {
          name: '東456',
          image: require('@/assets/east_456.jpg'),
          prefix: 'ア',
          filter: char => /^[ア-ヨ]$/.test(char)
        },
        {
          name: '東7',
          image: require('@/assets/east_7.jpg'),
          prefix: 'A',
          filter: char => /^[A-W]$/.test(char)
        },
        {
          name: '西12',
          image: require('@/assets/west_12.jpg'),
          prefix: 'あ',
          filter: char => /^[あ-め]$/.test(char)
        },
        {
          name: '南12',
          image: require('@/assets/south_12.jpg'),
          prefix: 'a',
          filter: char => /^[a-t]$/.test(char)
        }
      ]
    };
  },
  computed: {
    currentImage() {
      return this.venues[this.currentVenue].image;
    },
    visibleCircles() {
      if (!this.circles) return [];
    
      const venue = this.venues[this.currentVenue];
      const filterChar = venue.filter;
      const validKeys = Object.keys(placeMap);
      const targetId = this.$route.query.id;
      const targetPlace = this.$route.query.place;

      return this.circles.flatMap(circle => {
        if (circle.day !== this.selectedDay) return [];
    
        const matchedCodes = validKeys.filter(code => circle.place.includes(code));
        console.log('matchedCodes:', matchedCodes);
    
        return matchedCodes
          .filter(code => {
            const firstChar = code[0];
            return filterChar(firstChar); // prefix チェックを外す
          })
          .map(code => {
            const coords = placeMap[code];
            if (!coords) {
              console.warn(`placeMap に座標が見つかりません: ${code}`);
              return null;
            }
            const isHighlighted = circle.id === targetId && circle.place === targetPlace;
            return {
              ...circle,
              id: `${circle.id}_${code}`,
              coords,
              highlighted: isHighlighted
            };
          })
          .filter(Boolean);
        }).sort((a, b) => {
          // 場所（place）を文字コード順にソート
          return a.place.localeCompare(b.place, 'ja');
      });
    }
  },
  mounted() {
    axios.get(`${baseURL}/circles`)
      .then(response => {
        this.circles = response.data;
      })
      .catch(error => {
        console.error('データ取得エラー:', error);
      });
    axios.get(`${baseURL}/circles`)
      .then(response => {
        this.circles = response.data;
      })
      .then(() => {
        const targetId = this.$route.query.id;
        const targetPlace = this.$route.query.place;
        const targetDay = this.$route.query.day;

        if (targetId && targetPlace && targetDay) {
          this.selectedDay = targetDay;

          const venueIndex = this.venues.findIndex(venue => {
            const firstChar = targetPlace[0];
            return venue.filter(firstChar);
          });
          
          if (venueIndex !== -1) {
            this.currentVenue = venueIndex;
          }

          this.$nextTick(() => {
            const targetMarker = this.visibleCircles.find(c =>
              c.id.startsWith(targetId) && c.place === targetPlace
            );

            if (targetMarker && this.$refs.mapWrapper) {
              const wrapper = this.$refs.mapWrapper;
              const markerX = targetMarker.coords.x * this.scale;
              const markerY = targetMarker.coords.y * this.scale;

              // 中央にスクロールするように調整
              wrapper.scrollLeft = markerX - wrapper.clientWidth / 2;
              wrapper.scrollTop = markerY - wrapper.clientHeight / 2;
            }
          });
        }
      })
      .catch(error => {
        console.error('データ取得エラー:', error);
      });
  },
  methods: {
    // 距離計算
    getTouchDistance(touches) {
      const [touch1, touch2] = touches;
      const dx = touch2.clientX - touch1.clientX;
      const dy = touch2.clientY - touch1.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    },
    onTouchStart(e) {
      if (e.touches.length === 2) {
        this.isPinching = true;
        this.initialPinchDistance = this.getTouchDistance(e.touches);
      }
    },
    onTouchMove(e) {
      if (this.isPinching && e.touches.length === 2) {
        const currentDistance = this.getTouchDistance(e.touches);
        const scaleFactor = currentDistance / this.initialPinchDistance;
        this.scale = Math.min(Math.max(this.scale * scaleFactor, 0.5), 3); // 最小0.5〜最大3倍
        this.initialPinchDistance = currentDistance;
      }
    },
    onTouchEnd(e) {
      if (e.touches.length < 2) {
        this.isPinching = false;
        this.initialPinchDistance = null;
      }
    },
    setVenue(index) {
      this.currentVenue = index;
      this.resetZoom();
    },
    zoomIn() {
      this.scale += 0.1;
    },
    zoomOut() {
      if (this.scale > 0.2) {
        this.scale -= 0.1;
      }
    },
    resetZoom() {
      this.scale = 0.7;
      this.$refs.mapWrapper.scrollLeft = 0;
      this.$refs.mapWrapper.scrollTop = 0;
    },
    startDrag(event) {
      this.dragging = true;
      this.dragStart = {
        x: event.clientX,
        y: event.clientY,
        scrollLeft: this.$refs.mapWrapper.scrollLeft,
        scrollTop: this.$refs.mapWrapper.scrollTop
      };
    },
    onDrag(event) {
      if (this.dragging) {
        const dx = event.clientX - this.dragStart.x;
        const dy = event.clientY - this.dragStart.y;
        this.$refs.mapWrapper.scrollLeft = this.dragStart.scrollLeft - dx;
        this.$refs.mapWrapper.scrollTop = this.dragStart.scrollTop - dy;
      }
    },
    endDrag() {
      this.dragging = false;
    },
    getPriorityClass(marker) {
      if (marker.completed) return 'completed'; // 完了状態を最優先

      switch (marker.priority_label) {
        case '最優先':
          return 'priority-high';
        case 'できれば':
          return 'priority-medium';
        case '余裕があれば':
          return 'priority-low';
        case '不要になった':
          return 'priority-none';
        default:
          return '';
      }
    },
    focusOnMarker(marker) {
      const wrapper = this.$refs.mapWrapper;
      if (!wrapper || !marker.coords) return;

      const markerX = marker.coords.x * this.scale;
      const markerY = marker.coords.y * this.scale;

      wrapper.scrollLeft = markerX - wrapper.clientWidth / 2;
      wrapper.scrollTop = markerY - wrapper.clientHeight / 2;
    }
  }
};
</script>

<style scoped>
.venue-map-container {
  text-align: center;
  padding: 20px;
}

.venue-buttons {
  margin-bottom: 15px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}

.venue-buttons button {
  margin: 5px;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 1rem;
}

.day-selector {
  margin-bottom: 10px;
}

.day-selector button {
  margin: 0 5px;
  padding: 5px 10px;
  cursor: pointer;
}

.day-selector .active {
  background-color: #007bff;
  color: white;
}



.map-wrapper {
  width: 90%;
  max-width: 800px;
  height: 60vh;
  margin: 0 auto;
  overflow: auto;
  border: 1px solid #ccc;
  position: relative;
  background-color: #f8f8f8;
  user-select: none;
  cursor: grab;
  padding: 0;
}



.map-inner {
  position: absolute; /* ← 余白をなくすために absolute に変更 */
  top: 0;
  left: 0;
  transform-origin: top left;
  will-change: transform;
  margin: 0;
  padding: 0;
}


.map-and-info {
  display: flex;
  gap: 20px;
  justify-content: center;
  align-items: flex-start;
  flex-wrap: wrap;
}

.circle-info-list {
  width: 250px;
  max-height: 60vh;
  overflow-y: auto;
  background-color: #f9f9f9;
  border: 1px solid #ccc;
  padding: 10px;
  font-size: 0.9rem;
  text-align: left;
}

.circle-info-list ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.circle-info-list li {
  margin-bottom: 8px;
}



.venue-map-image {
  display: block;
  max-width: none; /* ← 元のサイズを維持 */
  height: auto;
  margin: 0;
  padding: 0;
}

.zoom-controls {
  margin-top: 10px;
}

.zoom-controls button {
  margin: 0 5px;
  padding: 5px 10px;
  cursor: pointer;
  font-size: 1rem;
}


.marker {
  position: absolute;
  background-color: rgba(255, 0, 0, 0.5); /* 通常色: 赤 */
  border: 1px solid red;
  pointer-events: none;
}

.marker.priority-high {
  background-color: rgba(255, 0, 0, 0.6); /* 最優先: 赤 */
  border: 1px solid red;
}

.marker.priority-medium {
  background-color: rgba(255, 165, 0, 0.6); /* できれば: オレンジ */
  border: 1px solid orange;
}

.marker.priority-low {
  background-color: rgba(255, 255, 0, 0.6); /* 余裕があれば: 黄色 */
  border: 1px solid gold;
}

.marker.priority-none {
  background-color: rgba(128, 128, 128, 0.8); /* 不要になった: グレー */
  border: 1px solid gray;
}

.marker.completed {
  background-color: rgba(0, 128, 0, 0.6); /* 完了: 緑 */
  border: 1px solid green;
}

.completed-label {
  margin-left: 8px;
  color: green;
  font-weight: bold;
}

.map-button {
  margin-left: 1px;
  margin-right: 5px;
  padding: 2px 4px;
  font-size: 0.8rem;
  cursor: pointer;
}

/* スマホ対応 */
@media (max-width: 600px) {
  .venue-buttons button,
  .zoom-controls button {
    font-size: 0.9rem;
    padding: 4px 8px;
  }

  .map-wrapper {
    height: 50vh;
  }
}
</style>
