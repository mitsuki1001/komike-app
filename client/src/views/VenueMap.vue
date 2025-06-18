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
            :class="{ completed: marker.completed }"
            :style="{
              top: marker.coords.y + 'px',
              left: marker.coords.x + 'px',
              width: marker.coords.width + 'px',
              height: marker.coords.height + 'px'
            }"
          >
          </div>
        </div>
      </div>
      <div class="circle-info-list">
        <h2>サークル一覧</h2>
        <ul>
          <li v-for="marker in visibleCircles" :key="marker.id">
            <strong>{{ marker.place }}</strong>:
            <router-link :to="{ name: 'CircleDetail', params: { id: marker.id.split('_')[0] } }">
              {{ marker.name }}
            </router-link>
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
      scale: 0.8,
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
            return {
              ...circle,
              id: `${circle.id}_${code}`,
              coords
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
  },
  methods: {
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
      this.scale = 0.8;
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
  width: 80%;
  max-width: 600px;
  height: 50vh;
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
  position: relative;
  width: 100%;
  display: block;
  transform-origin: top left;
  will-change: transform;
  padding: 0;
  margin: 0;
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
  max-width: 100%;
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
  background-color: rgba(255, 0, 0, 0.5); /* 通常色 */
  border: 1px solid red;
  pointer-events: none;
}

.marker.completed {
  background-color: rgba(0, 128, 0, 0.5); /* 完了状態は緑色 */
  border: 1px solid green;
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
