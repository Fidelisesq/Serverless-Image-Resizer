(function ($) {
    // Default API Gateway URLs for each route
    const apiGatewayBaseUrl = "https://e9emzthm09.execute-api.us-east-1.amazonaws.com/prod";
    const defaultUrls = {
        presign: `${apiGatewayBaseUrl}/presign`,
        list: `${apiGatewayBaseUrl}/list`,
        delete: `${apiGatewayBaseUrl}/delete`,
        resize: `${apiGatewayBaseUrl}/resize`
    };

    // Do not pre-populate fields initially. Set them as empty
    $("#functionUrlPresign").val("");
    $("#functionUrlList").val("");
    $("#functionUrlDelete").val("");
    $("#functionUrlResize").val("");

    let imageItemTemplate = Handlebars.compile($("#image-item-template").html());

    // Event listener for generating presign URL when the field is clicked
    $("#functionUrlPresign").click(async function () {
        try {
            // Send request to Lambda presign function to get the presigned URL
            const response = await $.ajax({
                url: defaultUrls.presign,
                method: "GET",
                success: function (result) {
                    const presignUrl = result.presignUrl; // Adjust this based on your Lambda's response structure
                    $("#functionUrlPresign").val(presignUrl); // Populate the field with the generated URL

                    // Optionally store it in localStorage for persistence
                    localStorage.setItem("functionUrlPresign", presignUrl);
                },
                error: function (error) {
                    console.error("Error generating presign URL:", error);
                    alert("Failed to generate presign URL.");
                }
            });
        } catch (error) {
            console.error("Error generating presign URL:", error);
            alert("Error generating presign URL.");
        }
    });

    // Handle other buttons like Load, Save, Clear in configForm
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

                // Load URLs for each Lambda function when requested
                await loadUrl("presign", "functionUrlPresign");
                await loadUrl("list", "functionUrlList");
                await loadUrl("delete", "functionUrlDelete");
                await loadUrl("resize", "functionUrlResize");

                alert("Function URL configurations loaded");
            } catch (error) {
                console.error("Error loading function URLs", error);
                alert("Error loading function URLs. Check the logs.");
            }
        } else if (action == "save") {
            // Save URLs to localStorage when Save is clicked
            localStorage.setItem("functionUrlPresign", $("#functionUrlPresign").val());
            localStorage.setItem("functionUrlList", $("#functionUrlList").val());
            localStorage.setItem("functionUrlDelete", $("#functionUrlDelete").val());
            localStorage.setItem("functionUrlResize", $("#functionUrlResize").val());
            alert("Configuration saved");
        } else if (action == "clear") {
            // Clear localStorage and form fields when Clear is clicked
            localStorage.clear();
            $("#functionUrlPresign, #functionUrlList, #functionUrlDelete, #functionUrlResize").val("");
            alert("Configuration cleared");
        } else {
            alert("Unknown action");
        }
    });

    // Upload form logic
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
        let functionUrlResize = $("#functionUrlResize").val();

        if (!functionUrlPresign) {
            alert("Please set the function URL for presign Lambda.");
            return;
        }
        if (!functionUrlResize) {
            alert("Please set the function URL for resize Lambda.");
            return;
        }

        let resizeOption = $("#resizeOption").val() || "400x400"; // Default resize option

        try {
            let response = await $.ajax({
                url: `${functionUrlResize}?fileName=${encodeURIComponent(file.name)}&size=${resizeOption}`,
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

})(jQuery);
