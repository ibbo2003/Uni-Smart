"use client";

import Link from "next/link";
import Image from "next/image";
import {
  AcademicCapIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-gray-900 to-gray-800 text-white mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <Image
                src="/logo.png"
                alt="UniSmart Logo"
                width={48}
                height={48}
                className="h-12 w-auto"
              />
              <div>
                <h3 className="text-2xl font-bold">UniSmart</h3>
                <p className="text-sm text-gray-400">
                  Smart University Management System
                </p>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              Streamlining academic excellence through intelligent management
              solutions. Empowering students, faculty, and administrators with
              cutting-edge technology.
            </p>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <AcademicCapIcon className="h-5 w-5 text-blue-400" />
              <span>Excellence in Education Technology</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/about"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/help"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3 text-sm text-gray-400">
                <MapPinIcon className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <span>Anjuman Institute of Technology, Bhatkal</span>
              </li>
              <li className="flex items-center space-x-3 text-sm text-gray-400">
                <EnvelopeIcon className="h-5 w-5 text-blue-400 flex-shrink-0" />
                <a
                  href="mailto:support@unismart.edu"
                  className="hover:text-white transition-colors"
                >
                  support@unismart.edu
                </a>
              </li>
              <li className="flex items-center space-x-3 text-sm text-gray-400">
                <PhoneIcon className="h-5 w-5 text-blue-400 flex-shrink-0" />
                <a
                  href="tel:+918241234567"
                  className="hover:text-white transition-colors"
                >
                  +91 824 123 4567
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-400">
              © {currentYear} UniSmart. All rights reserved.
            </p>
            <p className="text-sm text-gray-400 mt-2 md:mt-0">
              Developed by Computer Science Students
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
