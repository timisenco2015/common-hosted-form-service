<template>
  <v-row align="center"
    justify="space-around">
  
    <div style="display:flex;flex-direction:column;align-items:center;gap:20;">
      <v-text-field
        
        v-for="(data, index) in emailList"
        :key="`${index}`"
        label="email"
        :full-width=true
        v-model="data.email"  
      ></v-text-field>
      <v-tooltip bottom class="mt-5">
        <template #activator="{ on, attrs }">
          <v-btn
            class="mt-n1"
            color="primary"
            icon
            v-bind="attrs"
            v-on="on"
            @click="addMoreFields"
          >
            <v-icon class="mr-1">add_circle_outline</v-icon>
          </v-btn>
        </template>
        <span>add new field</span>
      </v-tooltip>
      <v-btn
        class="ma-2 mt-5"
        :loading="loading"
        :disabled="loading"
        color="primary"
        @click="sendLinkToEmails"
      >
        Send Email
      </v-btn>
    </div>
  </v-row>
</template>

<script>
export default {
  name: 'BaseShareEmail',
  data() {
    return{
      loading:false,
      emailList:[ {
        email:'',
      }
      ]
    };
  },
  methods:{
    addMoreFields(){
      this.emailList.push({
        email:'',
      });
    },
    sendLinkToEmails(){
      console.log('------------------->',this.emailList);
    }
  }
};
</script>
