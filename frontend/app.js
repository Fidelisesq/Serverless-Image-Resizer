(function ($) {
    let functionUrlPresign = localStorage.getItem("functionUrlPresign");
    let functionUrlList = localStorage.getItem("functionUrlList");
    let functionUrlDelete = localStorage.getItem("functionUrlDelete");

    if (functionUrlPresign) $("#functionUrlPresign").val(functionUrlPresign);
    if (functionUrlList) $("#functionUrlList").val(functionUrlList);
    if (functionUrlDelete) $("#functionUrlDelete").val(functionUrlDelete);

    let imageItemTemplate = Handlebars.compile($("#image-item-template").html());

    $("#configForm").submit(async function (event) {
        event.preventDefault();
        let action = event.originalEvent.submitter.getAttribute('name');

        if (action == "load") {
            try {
                let baseUrl = `${document.location.protocol}//${document.location.host}`;
                if (baseUrl.includes("file://")) baseUrl = `http://localhost:4566`;

                const headers = { authorization: "AWS4-HMAC-SHA256 Credential=test/..." };

                const loadUrl = async (funcName, resultElement) => {
                    const url = `${baseUrl}/2021-10-31/functions/${funcName}/urls`;
                    const result = await $.ajax({ url, headers }).promise();
                    const funcUrl = JSON.parse(result).FunctionUrlConfigs[0].FunctionUrl;
                    $(`#${resultElement}`).val(funcUrl);
                    localStorage.setItem(resultElement, funcUrl);
                };

                await loadUrl("presign", "functionUrlPresign");
                await loadUrl("list", "functionUrlList");
                await loadUrl("delete", "functionUrlDelete");

                alert("Function URL configurations loaded");
            } catch (error) {
                console.error("Error loading function URLs", error);
                alert("Error loading function URLs. Check the logs.");
            }
        } else if (action == "save") {
            localStorage.setItem("functionUrlPresign", $("#functionUrlPresign").val());
            localStorage.setItem("functionUrlList", $("#functionUrlList").val());
            localStorage.setItem("functionUrlDelete", $("#functionUrlDelete").val());
            alert("Configuration saved");
        } else if (action == "clear") {
            localStorage.clear();
            $("#functionUrlPresign, #functionUrlList, #functionUrlDelete").val("");
            alert("Configuration cleared");
        } else {
            alert("Unknown action");
        }
    });

    $("#uploadForm").submit(async function (event) {
        event.preventDefault();
        $("#uploadForm button").addClass('disabled');

        let file = $("#customFile")[0].files[0];
        if (!file) {
            alert("Please select a file to upload.");
            $("#uploadForm button").removeClass('disabled');
            return;
        }

        let functionUrlPresign = $("#functionUrlPresign").val();
        if (!functionUrlPresign) {
            alert("Please set the function URL for presign Lambda.");
            return;
        }

        let resizeOption = $("#resizeOption").val() || "400x400"; // Default resize option

        try {
            let response = await $.ajax({
                url: `${functionUrlPresign}?fileName=${encodeURIComponent(file.name)}&size=${resizeOption}`,
                method: "GET"
            });

            let formData = new FormData();
            Object.entries(response.fields).forEach(([key, value]) => formData.append(key, value));
            formData.append("file", file);

            await $.ajax({
                type: "POST",
                url: response.url,
                data: formData,
                processData: false,
                contentType: false
            });

            alert("Upload successful!");
            updateImageList();
        } catch (error) {
            console.error("Upload error:", error);
            alert("Error uploading file.");
        } finally {
            $("#uploadForm button").removeClass('disabled');
        }
    });

    function updateImageList() {
        let functionUrlList = $("#functionUrlList").val();
        if (!functionUrlList) {
            alert("Please set the function URL for list Lambda.");
            return;
        }

        $.ajax({
            url: functionUrlList,
            method: "GET",
            success: function (response) {
                $('#imagesContainer').empty();
                response.forEach(function (item) {
                    let cardHtml = imageItemTemplate(item);
                    $("#imagesContainer").append(cardHtml);
                });
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.error("Error fetching image list:", textStatus, errorThrown);
                alert("Error fetching images.");
            }
        });
    }

    function deleteImage(imageName) {
        let functionUrlDelete = $("#functionUrlDelete").val();
        if (!functionUrlDelete) {
            alert("Please set the function URL for delete Lambda.");
            return;
        }

        if (!confirm(`Are you sure you want to delete ${imageName}?`)) return;

        $.ajax({
            type: "DELETE",
            url: `${functionUrlDelete}?name=${encodeURIComponent(imageName)}`,
            success: function () {
                alert("Image deleted successfully!");
                updateImageList();
            },
            error: function (err) {
                console.error("Error deleting image:", err);
                alert("Failed to delete image.");
            }
        });
    }

    $("#updateImageListButton").click(function () {
        updateImageList();
    });

    if (functionUrlList) {
        updateImageList();
    }

    window.deleteImage = deleteImage; // Expose function globally for HTML button calls

})(jQuery);
