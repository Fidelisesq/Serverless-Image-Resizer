(function ($) {
    const apiGatewayBaseUrl = "https://dna76w1kjc.execute-api.us-east-1.amazonaws.com/prod";
    const cloudfrontBaseUrl = "https://image-resizer.fozdigitalz.com";

    const resizeOptionsGrouped = [
        {
            groupName: "Social Media Sizes",
            options: [
                { platform: "Instagram 📸", label: "Post", size: "1080x1080" },
                { platform: "Facebook 📘", label: "Shared Image", size: "1200x630" },
                { platform: "Twitter/X 🐦", label: "Summary Image", size: "1200x675" },
                { platform: "LinkedIn 💼", label: "Shared Link Image", size: "1200x627" },
                { platform: "YouTube ▶️", label: "Thumbnail", size: "1280x720" }
            ]
        },
        {
            groupName: "Standard Sizes",
            options: [
                { platform: "Thumbnail 🖼️", label: "", size: "150x150" },
                { platform: "Small Preview", label: "", size: "320x240" },
                { platform: "Medium Display", label: "", size: "640x480" },
                { platform: "Large Display", label: "", size: "800x600" },
                { platform: "Full HD", label: "", size: "1920x1080" }
            ]
        }
    ];

    const defaultUrls = {
        presign: `${apiGatewayBaseUrl}/presign`,
        list: `${apiGatewayBaseUrl}/list`,
        delete: `${apiGatewayBaseUrl}/delete`,
        resize: `${apiGatewayBaseUrl}/resize`
    };

    $(document).ready(function () {
        const $resizeSelect = $("#resizeOption");
        $resizeSelect.empty().append(`<option value="">-- Choose Size --</option>`);

        resizeOptionsGrouped.forEach(group => {
            const $group = $(`<optgroup label="${group.groupName}"></optgroup>`);
            group.options.forEach(opt => {
                const labelText = opt.label ? `${opt.platform} ${opt.label}` : opt.platform;
                $group.append(`<option value="${opt.size}">${labelText} (${opt.size})</option>`);
            });
            $resizeSelect.append($group);
        });

        $resizeSelect.select2({
            placeholder: "-- Choose Size --",
            width: '100%',
            templateResult: state => state.id ? $('<span>' + state.text + '</span>') : state.text,
            templateSelection: state => state.id ? $('<span>' + state.text + '</span>') : state.text
        });

        $resizeSelect.on('change', function () {
            localStorage.setItem('lastSelectedSize', $(this).val());
        });

        const lastSize = localStorage.getItem('lastSelectedSize');
        if (lastSize) $resizeSelect.val(lastSize).trigger('change');
    });

    $("#functionUrlPresign").click(async function () {
        const fileInput = $("#customFile")[0].files[0];
        if (!fileInput) return alert("Please select a file first.");

        const resizeSize = $("#resizeOption").val();
        if (!resizeSize) return alert("Please select a resize option first.");

        const fileName = encodeURIComponent(fileInput.name);

        try {
            const response = await $.ajax({
                url: `${defaultUrls.presign}?fileName=${fileName}&resizeSize=${resizeSize}`,
                method: "GET",
                dataType: "json"
            });

            if (!response?.url) throw new Error("Missing presigned URL");

            $("#presignUrlDisplay").val(response.url);
            try {
                await navigator.clipboard.writeText(response.url);
                new bootstrap.Toast(document.getElementById('clipboardToast')).show();
            } catch (clipErr) {
                console.warn("Clipboard copy failed:", clipErr);
            }

            localStorage.setItem("lastPresignedUrl", response.url);
        } catch (err) {
            console.error("Presign error:", err);
            alert("Failed to generate presign URL.");
        }
    });

    $("#uploadForm").submit(async function (e) {
        e.preventDefault();

        const file = $("#customFile")[0].files[0];
        const presignedUrl = $("#presignUrlDisplay").val();

        if (!file || !presignedUrl) return alert("Please select a file and generate a presigned URL first.");

        const btn = $("#uploadForm button[type='submit']");
        btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Uploading...');

        try {
            const response = await fetch(presignedUrl, {
                method: "PUT",
                body: file,
                headers: { "Content-Type": file.type }
            });

            if (!response.ok) throw new Error("Upload failed");

            new bootstrap.Toast(document.getElementById('uploadSuccessToast')).show();
            $("#customFile").val("");
            $("#presignUrlDisplay").val("");
            setTimeout(() => $("#loadImageListButton").click(), 2000);

        } catch (err) {
            console.error("Upload error:", err);
            alert("Upload failed.");
        } finally {
            btn.prop('disabled', false).html('⬆️ Upload Image');
        }
    });

    $("#loadImageListButton").click(async function () {
        const button = $(this);
        button.prop('disabled', true).html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Loading...');

        try {
            const response = await fetch(defaultUrls.list);
            const images = await response.json();
            const container = $("#imagesContainer").empty();

            if (!Array.isArray(images) || images.length === 0) {
                container.append("<p class='text-center mt-4'>No images found.</p>");
                return;
            }

            const templateSource = $("#image-item-template").html();
            const template = Handlebars.compile(templateSource);
            const selectedSize = $("#resizeOption").val() || localStorage.getItem('lastSelectedSize') || "800x600";

            images.forEach(img => {
                const s3Key = img.Name;
                const fileName = s3Key.split("/").pop();

                // Improved timestamp handling
                let timestamp = "Unknown";
                if (img.LastModified) {
                    try {
                        // Try parsing as ISO string first
                        if (typeof img.LastModified === 'string') {
                            const date = new Date(img.LastModified);
                            if (!isNaN(date.getTime())) {
                                timestamp = date.toLocaleString();
                            }
                        }
                        // If that fails, try parsing as number (epoch time)
                        else if (typeof img.LastModified === 'number') {
                            const date = new Date(img.LastModified);
                            if (!isNaN(date.getTime())) {
                                timestamp = date.toLocaleString();
                            }
                        }
                    } catch (e) {
                        console.warn("Could not parse date:", img.LastModified);
                    }
                }

                const imageData = {
                    Name: fileName,
                    Timestamp: timestamp,
                    Original: { URL: `${cloudfrontBaseUrl}/uploads/${encodeURIComponent(fileName)}` },
                    Resized: { URL: `${cloudfrontBaseUrl}/resized-${selectedSize}/uploads/${encodeURIComponent(fileName)}` }
                };

                container.append(template(imageData));
            });
        } catch (err) {
            console.error("List error:", err);
            alert("Failed to load image list.");
        } finally {
            button.prop('disabled', false).html('📄 Load My Images');
        }
    });

    window.deleteImage = async function (fileName) {
        if (!confirm(`Are you sure you want to delete ${fileName}?`)) return;

        const fullKey = `uploads/${fileName}`;
        const button = $(`button[onclick="deleteImage('${fileName}')"]`);
        button.prop('disabled', true).html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>');

        try {
            const url = new URL(defaultUrls.delete);
            url.searchParams.set("fileName", fullKey);

            const res = await fetch(url, { method: "DELETE" });
            
            if (res.ok) {
                // Create and show success toast manually
                const toastEl = document.createElement('div');
                toastEl.className = 'toast align-items-center text-white bg-success';
                toastEl.setAttribute('role', 'alert');
                toastEl.setAttribute('aria-live', 'assertive');
                toastEl.setAttribute('aria-atomic', 'true');
                toastEl.innerHTML = `
                    <div class="d-flex">
                        <div class="toast-body">
                            Image deleted successfully!
                        </div>
                        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                    </div>
                `;
                document.body.appendChild(toastEl);
                const toast = new bootstrap.Toast(toastEl);
                toast.show();
                
                // Remove toast after it hides
                toastEl.addEventListener('hidden.bs.toast', () => {
                    toastEl.remove();
                });
                
                // Reload the image list
                $("#loadImageListButton").click();
            } else {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
        } catch (err) {
            console.error("Delete error:", err);
            // Create and show error toast manually
            const toastEl = document.createElement('div');
            toastEl.className = 'toast align-items-center text-white bg-danger';
            toastEl.setAttribute('role', 'alert');
            toastEl.setAttribute('aria-live', 'assertive');
            toastEl.setAttribute('aria-atomic', 'true');
            toastEl.innerHTML = `
                <div class="d-flex">
                    <div class="toast-body">
                        Failed to delete image (but it might have been deleted)
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            `;
            document.body.appendChild(toastEl);
            const toast = new bootstrap.Toast(toastEl);
            toast.show();
            
            // Remove toast after it hides
            toastEl.addEventListener('hidden.bs.toast', () => {
                toastEl.remove();
            });
            
            // Reload the image list anyway
            $("#loadImageListButton").click();
        } finally {
            button.prop('disabled', false).html('🗑️ Delete');
        }
    };

})(jQuery);