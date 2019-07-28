<template>
  <div class="q-pa-md" style="max-width: 400px">
    <h1>Inloggen</h1>
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
        hint="Wachtwoord"
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

export default {
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
    handleSubmit(e) {
      e.preventDefault();
      this.errored = false;

      this.$v.$touch();

      if (!this.$v.$invalid) {
        return this.$api
          .post(`${this.$config.api_base_url}/sessions/logon`, {
            USERNAME: this.username,
            PASSWORD: this.password,
            DEPOT: this.depot
          })
          .then(res => {
            localStorage.setItem("user", JSON.stringify(res.data));
            localStorage.setItem("api_key", res.data.SESSIONID);

            if (localStorage.getItem("api_key") != null) {
              this.$store.commit("login", res.data);

              if (this.$route.params.nextUrl != null)
                this.$router.push(this.$route.params.nextUrl);
              else this.$router.push("/");
            }
          })
          .catch(e => {
            this.errored = true;
          });
      }
    }
  }
};
</script>
