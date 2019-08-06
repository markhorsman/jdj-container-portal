<template>
  <div class="q-px-lg q-pb-md">
    <h5>{{ title }}</h5>
    <q-btn color="primary" label="Download PDF" @click="download" class="float-right" />
    <br />
    <br />
    <br />
    <q-list bordered v-for="(entry, index) in feedEntries" v-bind:key="index">
      <q-expansion-item
        :label="entry.question"
        header-class="text-primary"
        :default-opened="parseInt(index) === 1"
        group="faq"
      >
        <q-card>
          <q-card-section>{{ entry.answer }}</q-card-section>
        </q-card>
      </q-expansion-item>
    </q-list>

    <div ref="content" class="hidden">
      <h3>JDJ Container Portal FAQ</h3>
      <div v-for="(entry, index) in feedEntries" v-bind:key="index">
        <h5>{{ entry.question }}</h5>
        <p>{{ entry.answer }}</p>
      </div>
    </div>
  </div>
</template>
<script>
import jsPDF from "jspdf";

export default {
  name: "Home",

  data() {
    return {
      feedEntries: {},
      title: "FAQ"
    };
  },

  mounted() {
    this.getFAQItems();
  },

  methods: {
    getFAQItems() {
      this.$api
        .get(
          `https://spreadsheets.google.com/feeds/cells/${this.$config.spreadsheet_id}/1/public/full?alt=json`
        )
        .then(result => {
          this.feedEntries = result.data.feed.entry.reduce((acc, entry) => {
            if (!acc[entry.gs$cell.row]) {
              acc[entry.gs$cell.row] = {
                question: entry.content.$t,
                answer: ""
              };
            } else {
              acc[entry.gs$cell.row].answer = entry.content.$t;
            }
            return acc;
          }, {});
        });
    },

    download() {
      const doc = new jsPDF();
      const contentHtml = this.$refs.content.innerHTML;
      doc.fromHTML(contentHtml, 15, 15, {
        width: 170
      });
      doc.save("JDJ Container Portal FAQ.pdf");
    }
  }
};
</script>
<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>