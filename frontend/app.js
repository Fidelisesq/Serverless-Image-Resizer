(function ($) {
    let functionUrlPresign = localStorage.getItem("functionUrlPresign");
    let functionUrlList = localStorage.getItem("functionUrlList");
    let functionUrlDelete = localStorage.getItem("functionUrlDelete");
    let functionUrlResize = localStorage.getItem("functionUrlResize");

    // Default API Gateway URLs for each route
    const apiGatewayBaseUrl = "https://hdyyqsov74.execute-api.us-east-1.amazonaws.com/prod";
    const defaultUrls = {
        presign: `${apiGatewayBaseUrl}/presign`,
        list: `${apiGatewayBaseUrl}/list`,
        delete: `${apiGatewayBaseUrl}/delete`,
        resize: `${apiGatewayBaseUrl}/resize`
    };

    // Load URLs from localStorage or use default URLs if not set
    if (!functionUrlPresign) functionUrlPresign = defaultUrls.presign;
    if (!functionUrlList) functionUrlList = defaultUrls.list;
    if (!functionUrlDelete) functionUrlDelete = defaultUrls.delete;
    if (!functionUrlResize) functionUrlResize = defaultUrls.resize;

    // Set the values in the form
    if (functionUrlPresign) $("#functionUrlPresign").val(functionUrlPresign);
    if (functionUrlList) $("#functionUrlList").val(functionUrlList);
    if (functionUrlDelete) $("#functionUrlDelete").val(functionUrlDelete);
    if (functionUrlResize) $("#functionUrlResize").val(functionUrlResize);

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

                // Use default URLs if function URL not set in localStorage
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
            localStorage.setItem("functionUrlPresign", $("#functionUrlPresign").val());
            localStorage.setItem("functionUrlList", $("#functionUrlList").val());
            localStorage.setItem("functionUrlDelete", $("#functionUrlDelete").val());
            localStorage.setItem("functionUrlResize", $("#functionUrlResize").val());
            alert("Configuration saved");
        } else if (action == "clear") {
            localStorage.clear();
            $("#functionUrlPresign, #functionUrlList, #functionUrlDelete, #functionUrlResize").val("");
            alert("Configuration cleared");
        } else {
            alert("Unknown action");
        }
    });

    // Upload form
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
