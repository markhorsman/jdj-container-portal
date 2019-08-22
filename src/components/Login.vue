<template>
  <div class="q-pa-md" style="max-width: 400px">
    <h5>Inloggen</h5>
    <q-form @submit="handleSubmit" @reset="onReset" class="q-gutter-md">
      <q-input
        filled
        v-model="$v.username.$model"
        id="username"
        :rules="[val => !!val || 'Gebruikersnaam is verplicht']"
        label="Gebruikersnaam"
      />
      <q-input
        v-model="$v.password.$model"
        id="password"
        filled
        :type="isPwd ? 'password' : 'text'"
        label="Wachtwoord"
        :rules="[val => !!val || 'Wachtwoord is verplicht']"
      >
        <template v-slot:append>
          <q-icon
            :name="isPwd ? 'visibility_off' : 'visibility'"
            class="cursor-pointer"
            @click="isPwd = !isPwd"
          />
        </template>
      </q-input>

      <q-input
        filled
        v-model="$v.depot.$model"
        id="depot"
        :rules="[val => !!val || 'Depot is verplicht']"
        label="Depot"
      />

      <div>
        <p v-show="errored" class="error">Inloggegevens onjuist</p>
        <q-btn label="Login" type="submit" color="primary" />
        <q-btn label="Reset" type="reset" color="primary" flat class="q-ml-sm" />
      </div>
    </q-form>
  </div>
</template>

<script>
import { required } from "vuelidate/lib/validators";
import { eventHub } from "../eventhub";

export default {
  name: "Login",
  
  data() {
    return {
      errored: false,
      username: "",
      password: "",
      depot: "",
      isPwd: true
    };
  },
  validations: {
    username: { required },
    password: { required },
    depot: { required }
  },
  methods: {
    status(validation) {
      return {
        error: validation.$error,
        dirty: validation.$dirty
      };
    },

    onReset(e) {
      this.username = "";
      this.password = "";
      this.depot = "";
    },

    async logon() {
      let result;

      try {
        result = await this.$api
          .post(`${this.$config.api_base_url}/sessions/logon`, {
            USERNAME: this.username,
            PASSWORD: this.password,
            DEPOT: this.depot.toUpperCase()
          },
          {
            headers: {
              skipLoader: true
            }
          });
      } catch (e) {
        console.log(e);
        result = false;
      }

      return result;
    },

    async getUser(key, recid) {
      let result, user;

      try {
        result = await this.$api
        .get(
          `${this.$config.api_base_url}users/?api_key=${key}&$fields=RECID,GRPCODE`,
          {
            headers: {
              skipLoader: true
            }
          }
        )
      } catch (e) {
        console.log(e);
        result = false;
        user = false;
      }

      if (result && result.data && result.data.length) {
        user = result.data.find(u => u.NAME === this.username && u.PASSWORD === this.password);
      }

      return user;
    },

    async handleSubmit(e) {
      e.preventDefault();
      this.errored = false;

      this.$v.$touch();

      if (!this.$v.$invalid) {
        eventHub.$emit("before-request");
        let result = await this.logon();

        if (!result) {
          this.errored = true;
          return;
        }

        const user = result.data;
        result = await this.getUser(user.SESSIONID, user.RECID);

        if (result) {
          user.GRPCODE = result.GRPCODE;
        }
        
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("api_key", user.SESSIONID);

        eventHub.$emit("after-response");

        if (localStorage.getItem("api_key") != null) {
          this.$store.commit("login", user);

          if (this.$route.params.nextUrl != null) {
            this.$router.push(this.$route.params.nextUrl);
          } else {
            this.$router.push("/");
          } 
        }
      }
    }
  }
};
</script>
