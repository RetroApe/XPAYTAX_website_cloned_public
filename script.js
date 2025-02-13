'use strict';

var navList;
var openButton;
var navLinks;

function getRelativePath(filePath) {
    const pathSegments = window.location.pathname.split('/').filter(Boolean); // Remove empty segments
    let depth = pathSegments.length - 1; // Subtract 2 to exclude the filename

    // Check if the site is in the English version
    if (pathSegments[0] === 'en') {
        depth--; 
    }

    const prefix = depth > 0 ? '../'.repeat(depth) : '';
    return prefix + filePath;
}


function adjustPaths(container) {
    if (!container) return;
    
    // Adjust image paths
    container.querySelectorAll('img').forEach(img => {
        const src = img.getAttribute('src');
        if (src && !src.startsWith('http') && !src.startsWith('mailto:')) {
            img.src = getRelativePath(src);
        }
    });

    // Adjust anchor links (ignore external links)
    container.querySelectorAll('a').forEach(a => {
        const href = a.getAttribute('href');
        if (href && !href.startsWith('http') && !href.startsWith('mailto:')) {
            a.href = getRelativePath(href);
        }
    });
}

function loadRecaptcha() {
    if (!document.getElementById("recaptcha-script")) {
        let script = document.createElement("script");
        script.src = "https://www.google.com/recaptcha/api.js?render=6Lc6lL8qAAAAAHqqPRQ1JaNi4UYSWXE5hsfNmO2m";
        script.id = "recaptcha-script";
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
    }
}

function handleAnchorClick(event, anchor) {
    const href = anchor.getAttribute("href");
    const anchorIndex = href.indexOf("#");

    if (anchorIndex !== -1) {
        const anchorId = href.substring(anchorIndex + 1);
        const targetElement = document.getElementById(anchorId);

        // ✅ If anchor exists on the page, let default behavior occur
        if (targetElement) {
            return;
        }

        // ❌ Otherwise, prevent default and store the anchor
        event.preventDefault();
        sessionStorage.setItem("pendingAnchor", anchorId);

        // Redirect to the page WITHOUT the anchor
        const baseUrl = href.substring(0, anchorIndex);
        window.location.href = baseUrl;
    }
}


function checkStoredAnchor() {
    const anchorId = sessionStorage.getItem("pendingAnchor");

    if (anchorId) {
        sessionStorage.removeItem("pendingAnchor"); // Remove it to prevent repeat scrolling

        requestAnimationFrame(() => {
            const targetElement = document.getElementById(anchorId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
                history.pushState(null, null, `#${anchorId}`); // Update URL with anchor
            }
        });
    }
}






document.addEventListener("DOMContentLoaded", () => {

    // Load navigation
    fetch(getRelativePath("components/nav.html"))
        .then(response => response.text())
        .then(data => {
            const navContainer = document.getElementById('navigation');
            navContainer.innerHTML = data;

            adjustPaths(navContainer); // Fix paths

            const navButton = document.getElementById("nav-button");
            navList = document.getElementById("nav-list");
            navLinks = document.querySelectorAll(".nav-link a");
            const navBar = document.getElementById("navbar");

            const currentPage = window.location.pathname.split("/").pop(); // Get the current page file name

            navLinks.forEach(link => {
                if (link.getAttribute("href") === currentPage) {
                    link.classList.add("active-link"); // Add active class
                    link.setAttribute("aria-current", "page"); // Set aria-current attribute
                } else {
                    link.classList.remove("active-link"); // Remove active class
                    link.removeAttribute("aria-current"); // Remove aria-current attribute
                }
            });

            const dropdown = document.querySelector(".dropdown");
            const dropdownContainer = dropdown.querySelector(".dropdown-container");
            const dropdownMenu = dropdownContainer.querySelector('.dropdown-menu');

            window.showDropdown = () => {
                if (dropdown) {
                    dropdown.classList.add("dropdown-shown");
                    dropdownContainer.removeAttribute('inert')
                }
            };

            window.hideDropdown = () => {
                if (dropdown) {
                    dropdown.classList.remove("dropdown-shown");
                    dropdownContainer.setAttribute('inert', "")
                }
            };


            openButton = document.getElementById("open-sidebar-button");

            navContainer.addEventListener("click", (event) => {
                if (event.target.id === "open-dropdown") {
                    dropdownContainer.classList.toggle("dropdown-show");
                }
            });


            // Handle clicks outside dropdown on mobile
            document.addEventListener("click", (event) => {
                if (window.innerWidth < 1000 && !dropdown.contains(event.target)) {
                    dropdownMenu.classList.remove("dropdown-shown");
                }
            });

            // Attach desktop event listeners
            if (window.innerWidth >= 1000) {
                dropdown.addEventListener("mouseover", showDropdown);
                dropdown.addEventListener("mouseout", hideDropdown);
            }

            // Function to move the button based on screen width
            function handleResize() {
                if (window.innerWidth <= 1000) {
                    // Move navButton into navList
                    if (!navList.contains(navButton)) {
                        const listItem = document.createElement("li");
                        listItem.className = "nav-button";
                        listItem.appendChild(navButton);
                        navList.appendChild(listItem);
                    }

                    dropdown.removeAttribute("onmouseover");
                    dropdown.removeAttribute("onmouseout");
                    dropdownMenu.removeAttribute('onmouseover');
                    dropdownMenu.removeAttribute("onmouseout");


                } else {
                    // Move navButton back to its original position
                    if (navList.contains(navButton)) {
                        navBar.appendChild(navButton);
                        const listItem = navList.querySelector(".nav-button:last-child"); // Remove the empty <li>
                        if (listItem) listItem.remove();
                    }

                    navList.classList.remove("show");  
                    const overlay = document.getElementById("overlay");
                    overlay.style.display = "none"; 

                    navList.removeAttribute('inert');

                    dropdown.setAttribute("onmouseover", "showDropdown()");
                    dropdown.setAttribute('onmouseout', "hideDropdown()");
                    dropdownMenu.setAttribute("onmouseover", "showDropdown()");
                    dropdownMenu.setAttribute('onmouseout', "hideDropdown()");

                }
            }

            document.querySelectorAll('a[href*="#"]').forEach(anchor => {
                anchor.addEventListener("click", (event) => handleAnchorClick(event, anchor));
            });


            // LANGUAGE SWITCHING

            const englishLink = document.getElementById("english-link");
            const germanLink = document.getElementById("german-link");

            const basePath = window.location.pathname;

            // Check if the current URL is in English or German
            if (basePath.startsWith("/en")) {
                // Switch to German by removing "/en"
                germanLink.href = basePath.replace("/en", "");
                englishLink.href = basePath; // English stays the same
            } else {
                // Switch to English by adding "/en"
                englishLink.href = "/en" + basePath;
                germanLink.href = basePath; // German stays the same
            }

            // Attach the function to the resize event and run it initially
            window.addEventListener("resize", handleResize);
            handleResize(); // Run initially to check current screen size
        });



    // Load footer
    fetch(getRelativePath("components/footer.html"))

        .then(response => response.text())
        .then(data => {
            document.getElementById('footer').innerHTML = data;
            adjustPaths(document.getElementById('footer'));
        });
});    



document.addEventListener("DOMContentLoaded", () => {

    const insertMessage = document.getElementById("insert-message");
    if (insertMessage) {
        fetch(getRelativePath("components/insert-message.html"))
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Failed to load insert-message.html");
                }
                return response.text();
            })
            .then((html) => {
                insertMessage.innerHTML = html;
                adjustPaths(insertMessage);
            })
            .catch((error) => console.error("Error injecting insert-message.html:", error));
    }

    const servicesSection = document.getElementById("services");
    if (servicesSection) {
        fetch(getRelativePath("components/services-comp.html"))
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Failed to load services-comp.html");
                }
                return response.text();
            })
            .then((html) => {
                servicesSection.innerHTML = html;
                adjustPaths(servicesSection);
            })
            .catch((error) => console.error("Error injecting services-comp.html:", error));
    }

    const benefitsSection = document.getElementById("benefits");
    if (benefitsSection) {
        fetch(getRelativePath("components/benefits.html"))
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Failed to load benefits.html");
                }
                return response.text();
            })
            .then((html) => {
                benefitsSection.innerHTML = html;
                adjustPaths(benefitsSection);
            })
            .catch((error) => console.error("Error injecting benefits.html:", error));
    }

    const corePricing = document.getElementById("core-pricing");
    if (corePricing) {
        fetch(getRelativePath("components/core-pricing.html"))
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Failed to load core-pricing.html");
                }
                return response.text();
            })
            .then((html) => {
                corePricing.innerHTML = html;
                adjustPaths(corePricing);
                checkStoredAnchor();
            })
            .catch((error) => console.error("Error injecting core-pricing.html:", error));
    }

    const reviewsSection = document.getElementById("reviews-section");

    // Fetch the carousel content from reviews.html
    if (reviewsSection) {
        fetch(getRelativePath("components/reviews.html"))
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Failed to load reviews.html");
                }
                return response.text();
            })
            .then((html) => {
                // Inject the carousel HTML into the placeholder
                reviewsSection.innerHTML = html;

                // Add JavaScript functionality for carousel navigation
                // initializeCarousel();
            })
            .catch((error) => {
                console.error("Error loading reviews.html:", error);
            });
    }

    const faq = document.getElementById('faq');

    if (faq) {
        fetch(getRelativePath("components/faq.html"))
            .then((response) => {
                if (!response.ok) {
                    throw new Error("Failed to load faq.html");
                }
                return response.text();
            })
            .then((html) => {
                faq.innerHTML = html;
    
                toggleFAQ();
            })
            .catch((error) => {
                console.error("Error loading faq.html:", error);
            })
    }
});



document.addEventListener("DOMContentLoaded", () => {
    // Fetch the contact form
    fetch(getRelativePath('components/contact-form.html'))
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load contact-form.html');
            }
            return response.text();
        })
        .then(html => {
            const contactFormSection = document.getElementById('contact-form');

            if (contactFormSection) {
                contactFormSection.innerHTML = html; // Insert fetched HTML content
                adjustPaths(contactFormSection);

                const recaptchaFlag = document.querySelector(".recaptcha-flag");

                window.showFlag = () => {
                    if (recaptchaFlag) {
                        recaptchaFlag.classList.add("flag-shown");
                    }
                };

                window.hideFlag = () => {
                    if (recaptchaFlag) {
                        recaptchaFlag.classList.remove("flag-shown");
                    }
                };
                

                // Attach form submission handler after content is loaded
                const form = document.querySelector("form");
                const overlay = document.getElementById("overlay-form");
                const successWindow = document.getElementById("success");
                const failureWindow = document.getElementById("failure");
                const emailInput = document.getElementById("email");
                const nameInput = document.getElementById("name");
                const privacyInput = document.getElementById("privacy-check");
                const messageInput = document.getElementById("message");
                const loader = document.getElementById("loader");
                const submitButton = form.querySelector("button[type='submit']");

                var isSubmitting = false;
                var action = form.getAttribute('action');

                console.log(action);
                action = getRelativePath(action);
                form.setAttribute('action', action);
                console.log(action);

                // console.log(form.getAttribute('action'));
                // form.setAttribute('action', getRelativePath(form.getAttribute('action')));
                // console.log(form.getAttribute('action'));

                if ("IntersectionObserver" in window) {
                    let observer = new IntersectionObserver((entries, observer) => {
                        if (entries[0].isIntersecting) {
                            loadRecaptcha();
                            observer.disconnect(); // Stop observing after loading once
                        }
                    });
            
                    observer.observe(form);
                }
            
                // Fallback: Load reCAPTCHA when the user interacts with the form
                form.addEventListener("focusin", loadRecaptcha, { once: true });

                // Function to validate email
                function isValidEmail(email) {
                    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                    return emailRegex.test(email);
                }

                // Helper function to set validity
                const setValidity = (input, isValid) => {
                    const invalidMessage = input.parentElement.querySelector(".invalid");
                    if (isValid) {
                        invalidMessage.classList.remove("invalid-show"); // Hide invalid message
                        input.classList.remove("invalid-show");
                        input.classList.add("valid-show");
                    } else {
                        invalidMessage.classList.add("invalid-show"); // Show invalid message
                        input.classList.add("invalid-show");
                        input.classList.remove("valid-show");
                    }
                };

                // Blur event listener
                [nameInput, emailInput, messageInput].forEach((input) => {
                    input.addEventListener("blur", () => {
                        if (input === emailInput) {
                            // Validate email
                            setValidity(emailInput, isValidEmail(emailInput.value));
                        } else {
                            // Validate other inputs (name and message)
                            setValidity(input, !!input.value.trim());
                        }
                    });
                });

                // Add change event listener for the checkbox
                privacyInput.addEventListener("change", () => {
                    // Validate the checkbox
                    setValidity(privacyInput, privacyInput.checked);
                });


                form.addEventListener("submit", async (event) => {
                    event.preventDefault();

                    if (isSubmitting) {
                        return;
                    }

                    submitButton.disabled = true;
                    isSubmitting = true; 

                    // Validate name input
                    const isNameValid = !!nameInput.value.trim();
                    setValidity(nameInput, isNameValid);

                    // Validate email input
                    const isEmailValid = isValidEmail(emailInput.value);
                    setValidity(emailInput, isEmailValid);

                    // Validate message input
                    const isMessageValid = !!messageInput.value.trim();
                    setValidity(messageInput, isMessageValid);

                    // Initial validation of checkbox
                    const isPrivacyValid = privacyInput.checked;
                    setValidity(privacyInput, isPrivacyValid);

                    // If any input is invalid, stop submission
                    if (!isNameValid || !isEmailValid || !isMessageValid || !isPrivacyValid) {
                        submitButton.disabled = false;
                        isSubmitting = false;
                        return;
                    }

                    
                    // Helper function to toggle loader visibility
                    const toggleLoader = (show) => {
                        if(show) {
                            overlay.classList.add("show");
                            loader.classList.add("show");
                            overlay.removeAttribute("onclick");
                        } else {
                            loader.classList.remove("show");
                            overlay.setAttribute("onclick", "dismissMessage()");
                        }
                    };

                    toggleLoader(true);

                    


                    // Checking/Sending PHP Mail
                    try {

                        // Get reCAPTCHA token
                        const recaptchaToken = await grecaptcha.execute('6Lc6lL8qAAAAAHqqPRQ1JaNi4UYSWXE5hsfNmO2m', { action: 'submit' });

                        // Add reCAPTCHA token to form data
                        const formData = new FormData(form);
                        formData.append("recaptchaToken", recaptchaToken);

                        // Send the form data to the PHP script
                        const response = await fetch(action, {
                            method: "POST",
                            body: formData,
                        });
                        const result = await response.json();

                        toggleLoader(false);

                        if (result.success) {
                            // Show success window
                            const useClientName = successWindow.querySelector(".use-client-name");
                            useClientName.textContent = nameInput.value.trim();

                            successWindow.classList.add("show");
                            successWindow.removeAttribute("inert");
                        } else {
                            // Show failure window
                            const useClientName = failureWindow.querySelector(".use-client-name");
                            useClientName.textContent = nameInput.value.trim();

                            failureWindow.classList.add("show");
                            failureWindow.removeAttribute("inert");
                        }
                    } catch (error) {
                        // Handle network errors
                        console.error("Error submitting form:", error);
                        toggleLoader(false);
                        const useClientName = failureWindow.querySelector(".use-client-name");
                        useClientName.textContent = nameInput.value.trim();
                        
                        overlay.classList.add("show");
                        failureWindow.classList.add("show");
                        failureWindow.removeAttribute("inert");
                    } finally {
                        toggleLoader(false);
                        submitButton.disabled = false;
                        isSubmitting = false;
                    }
                });



                

                // Dismiss message handler
                window.dismissMessage = () => {
                    overlay.classList.remove("show");
                    successWindow.classList.remove("show");
                    successWindow.setAttribute("inert", "");
                    failureWindow.classList.remove("show");
                    failureWindow.setAttribute("inert", "");
                };

                document.addEventListener('keydown', (event) => {
                    if (event.key === 'Escape') dismissMessage()
                });

            } else {
                console.error('Target element #contact-form not found');
            }
        })
        .catch(error => console.error('Error loading contact-form.html:', error));
});

















function openSidebar() {
    navList.classList.add("show");

    openButton.setAttribute('aria-expanded', 'true');

    const overlay = document.getElementById("overlay");
    overlay.style.display = "block";

    navList.removeAttribute('inert');
}


function closeSidebar() {
    navList.classList.remove("show");

    openButton.setAttribute('aria-expanded', 'false');

    const overlay = document.getElementById("overlay");
    overlay.style.display = "none";

    navList.setAttribute('inert', "");
}





document.addEventListener("DOMContentLoaded", () => {
    const scrollToTopButton = document.getElementById("scroll-to-top");

    // Show or hide the button based on scroll position
    window.addEventListener("scroll", () => {
        if (window.scrollY > 500 && (window.innerHeight + window.scrollY + 50) < document.body.offsetHeight) {
            scrollToTopButton.classList.add("show");
            scrollToTopButton.removeAttribute('inert');
        } else {
            scrollToTopButton.classList.remove("show");
            scrollToTopButton.setAttribute('inert', "");
            
        }
    });

    // Scroll back to the top when the button is clicked
    window.scrollToTop = function () {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };
});






const originalPoly = document.querySelector('.polygon');
const reversePoly = document.querySelector('.reverse-polygon');

function matchHeight() {
    const height = originalPoly.offsetHeight;
    const width = window.getComputedStyle(originalPoly).width;

    reversePoly.style.height = `${height}px`;
    reversePoly.style.width = `${width}`;
} 

// Run on load and resize
if (originalPoly) {
    window.addEventListener('load', matchHeight);
    window.addEventListener('resize', matchHeight);
}








function toggleFAQ() {
    var acc = document.getElementsByClassName("accordion");
    var i;

    for (i = 0; i < acc.length; i++) {
        acc[i].addEventListener("click", function() {
            this.classList.toggle("active-faq");
            this.nextElementSibling.classList.toggle("active-panel");

        });
    }
}


    

var width1 = 1440;
var width2 = 320;
var value1 = 96;
var value2 = 64;

var clampX;
var clampY;

clampY = (value1 - value2) / (width1 - width2);
clampX = value1 - width1 * clampY;

console.log(`clamp(${value2}px, ${clampX.toFixed(4)}px + ${(clampY * 100).toFixed(4)}vw, ${value1}px);`);
console.log(`clamp(${value2 / 16}rem, ${(clampX / 16).toFixed(4)}rem + ${(clampY * 100).toFixed(4)}vw, ${value1 / 16}rem);`);