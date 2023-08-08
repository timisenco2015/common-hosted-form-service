<template>
  <div class="text-center" style="z-index: 100" v-if="isShowMultiLangBtn">
    <v-menu offset-y>
      <template v-slot:activator="{ on, attrs }">
        <v-btn dark outlined v-bind="attrs" v-on="on" class="ml-3">
          <font-awesome-icon icon="fa-solid fa-globe" class="mr-1" />
          {{ language }}
          <font-awesome-icon icon="fa-solid fa-caret-down" class="ml-3" />
        </v-btn>
      </template>
      <v-list style="max-height: 90vh; overflow-y: auto">
        <v-list-item-group color="primary" v-model="languageIndex">
          <v-list-item
            v-for="(item, i) in languages"
            :key="i"
            @click="languageSelected(item)"
          >
            <v-list-item-content>
              <v-list-item-title v-text="item.TITLE"></v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list-item-group>
      </v-list>
    </v-menu>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import { faCaretDown, faGlobe } from '@fortawesome/free-solid-svg-icons';
import { library } from '@fortawesome/fontawesome-svg-core';

library.add(faCaretDown, faGlobe);

export default {
  name: 'BaseInternationalization',
  computed: {
    ...mapGetters('form', ['isShowMultiLangBtn', 'languages']),
    hasLogin() {
      return this.$route && this.$route.meta && this.$route.meta.hasLogin;
    },
  },
  data: () => {
    return {
      language: 'English',
      lang: 'en',
      languageIndex: 0,
    };
  },

  methods: {
    ...mapActions('form', ['setMultiLanguage']),
    languageSelected(lang) {
      this.language = lang.TITLE;
      this.$root.$i18n.locale = lang.KEYWORD;
      this.$vuetify.lang.current =
        lang.KEYWORD == 'zh'
          ? 'zhHans'
          : lang.KEYWORD == 'zh-TW'
          ? 'zhHant'
          : lang.KEYWORD;
      this.setMultiLanguage(lang.KEYWORD);
    },
  },
};
</script>

<style lang="scss" scoped>
.select {
  margin: 0px !important;
  margin-left: 8px !important;
  padding: 0px !important;
  height: 30px !important;

  float: right !important;
}
</style>
