## The website have one main domain and one subdomain. 

### domain: portal.inovatrix.io

This is the primary website used for promotion and job application.

No admin or password protection only static pages and a job application page.

Clerk based authentication is not neccassary.

The hr page should also come like this

portal.inovatrix.io/hr

### subdomain: portal.inovatrix.io

This is a HR portal.

If user comes on the portal.inovatrix.io they should go to portal.inovatrix.io/auth for login/signup

the pages under this subdomain should come from this 

portal.inovatrix.io/attendance
portal.inovatrix.io/settings


### The Admin page is part of the portal.inovatrix.io so it can be accessed from portal.inovatrix.io/admin

the admin pages can be accessed by portal.inovatrix.io/admin/settings. 

## The intended structure is like this.

In production:

portal.inovatrix.io → Main website (marketing, careers, job applications)
portal.inovatrix.io → HR portal (authentication required)
