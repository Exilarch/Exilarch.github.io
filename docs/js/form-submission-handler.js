(function () {

  function getFormData(form) {
    var elements = form.elements;
    var honeypot = "";

    var fields = Object.keys(elements)
      .filter(function (k) {
        if (elements[k].name === "honeypot") {
          honeypot = elements[k].value;
          return false;
        }

        return true;
      })
      .map(function (k) {
        if (elements[k].name !== undefined) {
          return elements[k].name;
        } else if (elements[k].length > 0) {
          return elements[k].item(0).name;
        }
      })
      .filter(function (item, pos, self) {
        return self.indexOf(item) === pos && item;
      });

    var formData = {};

    fields.forEach(function (name) {
      var element = elements[name];

      formData[name] = element.value;

      if (element.length) {
        var data = [];

        for (var i = 0; i < element.length; i++) {
          var item = element.item(i);

          if (item.checked || item.selected) {
            data.push(item.value);
          }
        }

        formData[name] = data.join(", ");
      }
    });

    formData.formDataNameOrder = JSON.stringify(fields);
    formData.formGoogleSheetName =
      form.dataset.sheet || "responses";

    formData.formGoogleSendEmail =
      form.dataset.email || "";

    return {
      data: formData,
      honeypot: honeypot
    };
  }


  async function handleFormSubmit(event) {

    event.preventDefault();

    var form = event.target;
    var formData = getFormData(form);
    var data = formData.data;

    // Client-side honeypot check
    if (formData.honeypot) {
      return false;
    }

    disableAllButtons(form);

    try {

      var encoded = Object.keys(data)
        .map(function (key) {
          return encodeURIComponent(key) +
            "=" +
            encodeURIComponent(data[key]);
        })
        .join("&");

      var response = await fetch(form.action, {
        method: "POST",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded"
        },
        body: encoded
      });

      if (!response.ok) {
        throw new Error(
          "Server returned HTTP " + response.status
        );
      }

      var result = await response.json();

      console.log("Contact form response:", result);

      if (result.result !== "success") {
        throw new Error(
          result.error || "Form submission failed."
        );
      }

      // Submission succeeded
      form.reset();

      var formElements =
        form.querySelector(".form-elements");

      if (formElements) {
        formElements.style.display = "none";
      }

      var turnstile =
        form.querySelector(".cf-turnstile");

      if (turnstile) {
        turnstile.style.display = "none";
      }

      var thankYouMessage =
        form.querySelector(".thankyou_message");

      if (thankYouMessage) {
        thankYouMessage.style.display = "block";
      }

    } catch (error) {

      console.error(
        "Contact form submission failed:",
        error
      );

      alert(
        "Sorry, there was a problem submitting your message. " +
        "Please try again or call us at (714) 241-1680."
      );

      enableAllButtons(form);
    }

    return false;
  }


  function loaded() {

    var forms =
      document.querySelectorAll("form.gform");

    for (var i = 0; i < forms.length; i++) {

      forms[i].addEventListener(
        "submit",
        handleFormSubmit,
        false
      );

    }
  }


  function disableAllButtons(form) {

    var buttons =
      form.querySelectorAll("button");

    for (var i = 0; i < buttons.length; i++) {
      buttons[i].disabled = true;
    }
  }


  function enableAllButtons(form) {

    var buttons =
      form.querySelectorAll("button");

    for (var i = 0; i < buttons.length; i++) {
      buttons[i].disabled = false;
    }
  }


  document.addEventListener(
    "DOMContentLoaded",
    loaded,
    false
  );

})();
