const path = require("path"),
  fs = require("fs");

const UPLOAD_DIR = path.resolve(__dirname, "..", "..", "uploads");

exports.regFilePath = (file) => {
  return path.join(UPLOAD_DIR, file);
};

const saveBase64File = (data, file) => {
  let base64Data = data.split(";base64,").pop();

  fs.writeFile(
    path.join(UPLOAD_DIR, file),
    base64Data,
    { encoding: "base64" },
    function (err) {
      console.error(err);
    }
  );
};

function createValue(value) {
  let val = null;
  if (!value) {
    return [
      {
        value,
      },
    ];
  }
  if (value.type === "FILE") {
    let isNewFile = value.value;
    let fileName = isNewFile
      ? `${Date.now()}_${value.name}`
      : value.existingName;
    if (isNewFile) saveBase64File(value.value, fileName);
    val = [
      {
        value: fileName,
      },
    ];
  } else if (value.type === "ITEMS") {
    let items = value.value;
    val = [
      {
        value: Array.from(items).join(","),
      },
    ];
  } else {
    val =
      value && Array.isArray(value)
        ? value.map((v) => {
            return {
              value: v.id || v.name,
              extra: v.extra,
            };
          })
        : [
            {
              value,
            },
          ];
  }
  return val;
}

exports.createRecord = function createRecord(profileId, key, value) {
  let obj = {
    profile_id: profileId,
    name: key,
    type: value && Array.isArray(value) ? "MULTISELECT" : "SINGLE",
    values: createValue(value),
  };
  return obj;
};
